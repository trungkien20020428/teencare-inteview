import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Parent } from '../entities/Parent';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email)
    return res.status(400).json({ error: 'name, phone, and email are required' });

  try {
    const repo = AppDataSource.getRepository(Parent);
    const parent = await repo.save({ name, phone, email });
    return res.status(201).json(parent);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Parent);
  const parents = await repo.find({ relations: ['students'], order: { createdAt: 'ASC' } });
  return res.json(parents);
});

router.get('/:id', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Parent);
  const parent = await repo.findOne({
    where: { id: req.params.id },
    relations: ['students'],
  });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  return res.json(parent);
});

export default router;
