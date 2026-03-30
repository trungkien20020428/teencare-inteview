import request from 'supertest';
import express from 'express';
import 'reflect-metadata';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import parentsRouter from '../../routes/parents';
import { AppDataSource } from '../../data-source';

const app = express();
app.use(express.json());
app.use('/api/parents', parentsRouter);

const mockRepo = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
});

// ─── POST /api/parents ───────────────────────────────────────────────────────

describe('POST /api/parents', () => {
  it('201 – creates parent successfully', async () => {
    const parent = { id: 'p1', name: 'Nguyen Van A', phone: '0901234567', email: 'a@test.com' };
    mockRepo.save.mockResolvedValue(parent);

    const res = await request(app).post('/api/parents').send({
      name: 'Nguyen Van A',
      phone: '0901234567',
      email: 'a@test.com',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Nguyen Van A', email: 'a@test.com' });
    expect(mockRepo.save).toHaveBeenCalledWith({ name: 'Nguyen Van A', phone: '0901234567', email: 'a@test.com' });
  });

  it('400 – missing name', async () => {
    const res = await request(app).post('/api/parents').send({ phone: '0901234567', email: 'a@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing phone', async () => {
    const res = await request(app).post('/api/parents').send({ name: 'A', email: 'a@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing email', async () => {
    const res = await request(app).post('/api/parents').send({ name: 'A', phone: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('409 – duplicate email (PG unique violation)', async () => {
    mockRepo.save.mockRejectedValue({ code: '23505' });

    const res = await request(app).post('/api/parents').send({
      name: 'A',
      phone: '123',
      email: 'dup@test.com',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Email already exists/);
  });

  it('500 – unexpected database error', async () => {
    mockRepo.save.mockRejectedValue(new Error('DB crash'));

    const res = await request(app).post('/api/parents').send({ name: 'A', phone: '123', email: 'x@test.com' });
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/parents/:id ────────────────────────────────────────────────────

describe('GET /api/parents/:id', () => {
  it('200 – returns parent with students', async () => {
    const parent = { id: 'p1', name: 'Nguyen Van A', students: [] };
    mockRepo.findOne.mockResolvedValue(parent);

    const res = await request(app).get('/api/parents/p1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'p1', name: 'Nguyen Van A' });
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'p1' },
      relations: ['students'],
    });
  });

  it('404 – parent not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/parents/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Parent not found/);
  });
});
