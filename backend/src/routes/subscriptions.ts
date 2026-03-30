import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Subscription } from '../entities/Subscription';
import { Student } from '../entities/Student';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { studentId, packageName, startDate, endDate, totalSessions } = req.body;
  if (!studentId || !packageName || !startDate || !endDate || !totalSessions)
    return res.status(400).json({ error: 'studentId, packageName, startDate, endDate, totalSessions are required' });

  if (endDate <= startDate)
    return res.status(400).json({ error: 'endDate must be after startDate' });

  const student = await AppDataSource.getRepository(Student).findOneBy({ id: studentId });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const repo = AppDataSource.getRepository(Subscription);
  const sub = await repo.save({ studentId, packageName, startDate, endDate, totalSessions: Number(totalSessions) });
  return res.status(201).json({ ...sub, student });
});

router.get('/', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Subscription);
  const where = req.query.studentId ? { studentId: String(req.query.studentId) } : {};
  const subs = await repo.find({ where, relations: ['student'], order: { createdAt: 'DESC' } });
  const today = new Date().toISOString().split('T')[0];
  return res.json(subs.map((s) => ({
    ...s,
    remainingSessions: s.totalSessions - s.usedSessions,
    isActive: s.endDate >= today && s.usedSessions < s.totalSessions,
  })));
});

router.get('/:id', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Subscription);
  const sub = await repo.findOne({ where: { id: req.params.id }, relations: ['student'] });
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const today = new Date().toISOString().split('T')[0];
  return res.json({
    ...sub,
    remainingSessions: sub.totalSessions - sub.usedSessions,
    isActive: sub.endDate >= today && sub.usedSessions < sub.totalSessions,
    isExpired: sub.endDate < today,
    isExhausted: sub.usedSessions >= sub.totalSessions,
  });
});

router.patch('/:id/use', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Subscription);
  const sub = await repo.findOneBy({ id: req.params.id });
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const today = new Date().toISOString().split('T')[0];
  if (sub.endDate < today) return res.status(400).json({ error: 'Subscription has expired' });
  if (sub.usedSessions >= sub.totalSessions) return res.status(400).json({ error: 'No remaining sessions' });

  await repo.increment({ id: sub.id }, 'usedSessions', 1);
  const updated = await repo.findOneBy({ id: sub.id });
  return res.json({ ...updated, remainingSessions: updated!.totalSessions - updated!.usedSessions });
});

export default router;
