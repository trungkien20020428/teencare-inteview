import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Class } from '../entities/Class';
import { Student } from '../entities/Student';
import { ClassRegistration } from '../entities/ClassRegistration';
import { Subscription } from '../entities/Subscription';
import { timeSlotsOverlap } from '../utils/timeUtils';

const router = Router();
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

router.post('/', async (req: Request, res: Response) => {
  const { name, subject, dayOfWeek, timeSlot, teacherName, maxStudents } = req.body;
  if (!name || !subject || !dayOfWeek || !timeSlot || !teacherName || !maxStudents)
    return res.status(400).json({ error: 'All fields are required' });

  if (!VALID_DAYS.includes(dayOfWeek))
    return res.status(400).json({ error: `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}` });

  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot))
    return res.status(400).json({ error: 'timeSlot format must be HH:MM-HH:MM' });

  const repo = AppDataSource.getRepository(Class);
  const cls = await repo.save({ name, subject, dayOfWeek, timeSlot, teacherName, maxStudents: Number(maxStudents) });
  return res.status(201).json(cls);
});

router.get('/', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Class);
  const qb = repo.createQueryBuilder('class')
    .loadRelationCountAndMap('class.enrolledCount', 'class.registrations');

  if (req.query.day) qb.where('class.dayOfWeek = :day', { day: req.query.day });
  qb.orderBy('class.dayOfWeek').addOrderBy('class.timeSlot');

  const classes = await qb.getMany();
  return res.json(classes.map((c: any) => ({
    ...c,
    availableSlots: c.maxStudents - (c.enrolledCount ?? 0),
  })));
});

router.get('/:id', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Class);
  const cls = await repo.findOne({
    where: { id: req.params.id },
    relations: ['registrations', 'registrations.student'],
  });
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  return res.json({ ...cls, enrolledCount: cls.registrations.length, availableSlots: cls.maxStudents - cls.registrations.length });
});

// POST /api/classes/:class_id/register
router.post('/:class_id/register', async (req: Request, res: Response) => {
  const { class_id } = req.params;
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId is required' });

  const classRepo = AppDataSource.getRepository(Class);
  const studentRepo = AppDataSource.getRepository(Student);
  const regRepo = AppDataSource.getRepository(ClassRegistration);
  const subRepo = AppDataSource.getRepository(Subscription);

  const cls = await classRepo.findOne({ where: { id: class_id }, relations: ['registrations'] });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  if (cls.registrations.length >= cls.maxStudents)
    return res.status(409).json({ error: 'Class is full (max_students reached)' });

  const student = await studentRepo.findOneBy({ id: studentId });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const alreadyRegistered = await regRepo.findOneBy({ classId: class_id, studentId });
  if (alreadyRegistered) return res.status(409).json({ error: 'Student already registered in this class' });

  // Time slot conflict check
  const studentRegs = await regRepo.find({
    where: { studentId },
    relations: ['class'],
  });
  const conflict = studentRegs.find(
    (r) => r.class.dayOfWeek === cls.dayOfWeek && timeSlotsOverlap(r.class.timeSlot, cls.timeSlot)
  );
  if (conflict)
    return res.status(409).json({ error: `Time slot conflict with "${conflict.class.name}" (${conflict.class.dayOfWeek} ${conflict.class.timeSlot})` });

  // Valid subscription check
  const today = new Date().toISOString().split('T')[0];
  const subs = await subRepo.find({ where: { studentId }, order: { createdAt: 'DESC' } });
  const validSub = subs.find((s) => s.endDate >= today && s.usedSessions < s.totalSessions);
  if (!validSub)
    return res.status(403).json({ error: 'Student has no active subscription with remaining sessions' });

  // Transaction: create registration + increment usedSessions
  await AppDataSource.transaction(async (manager) => {
    await manager.save(ClassRegistration, { classId: class_id, studentId });
    await manager.increment(Subscription, { id: validSub.id }, 'usedSessions', 1);
  });

  const registration = await regRepo.findOne({
    where: { classId: class_id, studentId },
    relations: ['class', 'student'],
  });

  return res.status(201).json({
    ...registration,
    subscriptionUsed: {
      id: validSub.id,
      packageName: validSub.packageName,
      usedSessions: validSub.usedSessions + 1,
      totalSessions: validSub.totalSessions,
    },
  });
});

export default router;
