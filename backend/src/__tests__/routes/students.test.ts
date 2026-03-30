import request from 'supertest';
import express from 'express';
import 'reflect-metadata';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import studentsRouter from '../../routes/students';
import { AppDataSource } from '../../data-source';

const app = express();
app.use(express.json());
app.use('/api/students', studentsRouter);

const mockParentRepo = {
  findOneBy: jest.fn(),
};
const mockStudentRepo = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
    if (entity.name === 'Parent') return mockParentRepo;
    return mockStudentRepo;
  });
});

// ─── POST /api/students ───────────────────────────────────────────────────────

describe('POST /api/students', () => {
  const validPayload = {
    name: 'Tran Thi B',
    dob: '2010-05-15',
    gender: 'female',
    currentGrade: '8',
    parentId: 'p1',
  };

  it('201 – creates student with parent info', async () => {
    const parent = { id: 'p1', name: 'Nguyen Van A' };
    const student = { id: 's1', ...validPayload };
    mockParentRepo.findOneBy.mockResolvedValue(parent);
    mockStudentRepo.save.mockResolvedValue(student);

    const res = await request(app).post('/api/students').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 's1', name: 'Tran Thi B' });
    expect(res.body.parent).toMatchObject({ id: 'p1' });
  });

  it('400 – missing name', async () => {
    const { name, ...rest } = validPayload;
    const res = await request(app).post('/api/students').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing dob', async () => {
    const { dob, ...rest } = validPayload;
    const res = await request(app).post('/api/students').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing gender', async () => {
    const { gender, ...rest } = validPayload;
    const res = await request(app).post('/api/students').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing currentGrade', async () => {
    const { currentGrade, ...rest } = validPayload;
    const res = await request(app).post('/api/students').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing parentId', async () => {
    const { parentId, ...rest } = validPayload;
    const res = await request(app).post('/api/students').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('404 – parent not found', async () => {
    mockParentRepo.findOneBy.mockResolvedValue(null);

    const res = await request(app).post('/api/students').send(validPayload);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Parent not found/);
  });
});

// ─── GET /api/students/:id ───────────────────────────────────────────────────

describe('GET /api/students/:id', () => {
  it('200 – returns student with parent and related data', async () => {
    const student = {
      id: 's1',
      name: 'Tran Thi B',
      parent: { id: 'p1', name: 'Nguyen Van A' },
      registrations: [],
      subscriptions: [],
    };
    mockStudentRepo.findOne.mockResolvedValue(student);

    const res = await request(app).get('/api/students/s1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 's1', name: 'Tran Thi B' });
    expect(res.body.parent).toMatchObject({ id: 'p1' });
    expect(mockStudentRepo.findOne).toHaveBeenCalledWith({
      where: { id: 's1' },
      relations: ['parent', 'registrations', 'registrations.class', 'subscriptions'],
    });
  });

  it('404 – student not found', async () => {
    mockStudentRepo.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/students/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Student not found/);
  });
});
