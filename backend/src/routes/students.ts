import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Student } from '../entities/Student';
import { Parent } from '../entities/Parent';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { name, dob, gender, currentGrade, parentId } = req.body;
  if (!name || !dob || !gender || !currentGrade || !parentId)
    return res.status(400).json({ error: 'name, dob, gender, currentGrade, parentId are required' });

  const parentRepo = AppDataSource.getRepository(Parent);
  const parent = await parentRepo.findOneBy({ id: parentId });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const repo = AppDataSource.getRepository(Student);
  const student = await repo.save({ name, dob, gender, currentGrade: String(currentGrade), parentId });
  return res.status(201).json({ ...student, parent });
});

router.get('/', async (_req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Student);
  const students = await repo.find({ relations: ['parent'], order: { createdAt: 'ASC' } });
  return res.json(students);
});

router.get('/:id', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Student);
  const student = await repo.findOne({
    where: { id: req.params.id },
    relations: ['parent', 'registrations', 'registrations.class', 'subscriptions'],
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  return res.json(student);
});

export default router;
