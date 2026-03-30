import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ClassRegistration } from '../entities/ClassRegistration';
import { Subscription } from '../entities/Subscription';
import { isEligibleForRefund } from '../utils/timeUtils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(ClassRegistration);
  const where: Record<string, string> = {};
  if (req.query.studentId) where.studentId = String(req.query.studentId);
  if (req.query.classId) where.classId = String(req.query.classId);

  const regs = await repo.find({ where, relations: ['class', 'student'], order: { registeredAt: 'DESC' } });
  return res.json(regs);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const regRepo = AppDataSource.getRepository(ClassRegistration);
  const subRepo = AppDataSource.getRepository(Subscription);

  const reg = await regRepo.findOne({
    where: { id: req.params.id },
    relations: ['class', 'student'],
  });
  if (!reg) return res.status(404).json({ error: 'Registration not found' });

  const refundEligible = isEligibleForRefund(reg.class.dayOfWeek, reg.class.timeSlot);

  await AppDataSource.transaction(async (manager) => {
    await manager.remove(ClassRegistration, reg);

    if (refundEligible) {
      const sub = await subRepo.findOne({
        where: { studentId: reg.studentId },
        order: { createdAt: 'DESC' },
      });
      if (sub && sub.usedSessions > 0) {
        await manager.decrement(Subscription, { id: sub.id }, 'usedSessions', 1);
      }
    }
  });

  return res.json({
    message: refundEligible
      ? 'Registration cancelled. 1 session refunded.'
      : 'Registration cancelled. No refund (< 24h before class).',
    refunded: refundEligible,
    studentName: reg.student.name,
    className: reg.class.name,
  });
});

export default router;
