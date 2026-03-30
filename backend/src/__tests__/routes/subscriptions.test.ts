import request from 'supertest';
import express from 'express';
import 'reflect-metadata';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import subscriptionsRouter from '../../routes/subscriptions';
import { AppDataSource } from '../../data-source';

const app = express();
app.use(express.json());
app.use('/api/subscriptions', subscriptionsRouter);

const mockStudentRepo = { findOneBy: jest.fn() };
const mockSubRepo = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  increment: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
    if (entity.name === 'Student') return mockStudentRepo;
    return mockSubRepo;
  });
});

// ─── POST /api/subscriptions ──────────────────────────────────────────────────

describe('POST /api/subscriptions', () => {
  const validPayload = {
    studentId: 's1',
    packageName: 'Gói 10 Buổi',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalSessions: 10,
  };

  it('201 – creates subscription with student info', async () => {
    const student = { id: 's1', name: 'Tran Thi B' };
    const sub = { id: 'sub1', ...validPayload, usedSessions: 0 };
    mockStudentRepo.findOneBy.mockResolvedValue(student);
    mockSubRepo.save.mockResolvedValue(sub);

    const res = await request(app).post('/api/subscriptions').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'sub1', packageName: 'Gói 10 Buổi' });
    expect(res.body.student).toMatchObject({ id: 's1' });
  });

  it('400 – missing studentId', async () => {
    const { studentId, ...rest } = validPayload;
    const res = await request(app).post('/api/subscriptions').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing packageName', async () => {
    const { packageName, ...rest } = validPayload;
    const res = await request(app).post('/api/subscriptions').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing startDate', async () => {
    const { startDate, ...rest } = validPayload;
    const res = await request(app).post('/api/subscriptions').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing endDate', async () => {
    const { endDate, ...rest } = validPayload;
    const res = await request(app).post('/api/subscriptions').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – missing totalSessions', async () => {
    const { totalSessions, ...rest } = validPayload;
    const res = await request(app).post('/api/subscriptions').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – endDate is before startDate', async () => {
    const res = await request(app).post('/api/subscriptions').send({
      ...validPayload,
      startDate: '2026-06-30',
      endDate: '2026-01-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/endDate must be after startDate/);
  });

  it('400 – endDate equals startDate', async () => {
    const res = await request(app).post('/api/subscriptions').send({
      ...validPayload,
      startDate: '2026-01-01',
      endDate: '2026-01-01',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/endDate must be after startDate/);
  });

  it('404 – student not found', async () => {
    mockStudentRepo.findOneBy.mockResolvedValue(null);

    const res = await request(app).post('/api/subscriptions').send(validPayload);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Student not found/);
  });
});

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

describe('GET /api/subscriptions', () => {
  it('200 – returns list with computed remainingSessions and isActive', async () => {
    const sub = {
      id: 'sub1',
      studentId: 's1',
      endDate: '2099-12-31',
      usedSessions: 3,
      totalSessions: 10,
      student: { id: 's1' },
    };
    mockSubRepo.find.mockResolvedValue([sub]);

    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ remainingSessions: 7, isActive: true });
  });

  it('200 – isActive is false when endDate is in the past', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2020-01-01',
      usedSessions: 0,
      totalSessions: 10,
    };
    mockSubRepo.find.mockResolvedValue([sub]);

    const res = await request(app).get('/api/subscriptions');
    expect(res.body[0].isActive).toBe(false);
  });

  it('200 – isActive is false when sessions exhausted', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2099-12-31',
      usedSessions: 10,
      totalSessions: 10,
    };
    mockSubRepo.find.mockResolvedValue([sub]);

    const res = await request(app).get('/api/subscriptions');
    expect(res.body[0].isActive).toBe(false);
  });

  it('200 – filters by studentId query param', async () => {
    mockSubRepo.find.mockResolvedValue([]);

    await request(app).get('/api/subscriptions?studentId=s1');
    expect(mockSubRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 's1' } })
    );
  });
});

// ─── GET /api/subscriptions/:id ──────────────────────────────────────────────

describe('GET /api/subscriptions/:id', () => {
  it('200 – returns subscription with all computed fields', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2099-12-31',
      usedSessions: 4,
      totalSessions: 10,
      student: { id: 's1' },
    };
    mockSubRepo.findOne.mockResolvedValue(sub);

    const res = await request(app).get('/api/subscriptions/sub1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      remainingSessions: 6,
      isActive: true,
      isExpired: false,
      isExhausted: false,
    });
  });

  it('200 – isExpired true when endDate is past', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2020-01-01',
      usedSessions: 0,
      totalSessions: 10,
      student: {},
    };
    mockSubRepo.findOne.mockResolvedValue(sub);

    const res = await request(app).get('/api/subscriptions/sub1');
    expect(res.body.isExpired).toBe(true);
    expect(res.body.isActive).toBe(false);
  });

  it('200 – isExhausted true when all sessions used', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2099-12-31',
      usedSessions: 10,
      totalSessions: 10,
      student: {},
    };
    mockSubRepo.findOne.mockResolvedValue(sub);

    const res = await request(app).get('/api/subscriptions/sub1');
    expect(res.body.isExhausted).toBe(true);
    expect(res.body.isActive).toBe(false);
  });

  it('404 – subscription not found', async () => {
    mockSubRepo.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/subscriptions/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Subscription not found/);
  });
});

// ─── PATCH /api/subscriptions/:id/use ────────────────────────────────────────

describe('PATCH /api/subscriptions/:id/use', () => {
  it('200 – decrements remaining sessions', async () => {
    const sub = {
      id: 'sub1',
      endDate: '2099-12-31',
      usedSessions: 3,
      totalSessions: 10,
    };
    const updated = { ...sub, usedSessions: 4 };
    mockSubRepo.findOneBy
      .mockResolvedValueOnce(sub)      // initial fetch
      .mockResolvedValueOnce(updated); // re-fetch after increment
    mockSubRepo.increment.mockResolvedValue({});

    const res = await request(app).patch('/api/subscriptions/sub1/use');
    expect(res.status).toBe(200);
    expect(res.body.usedSessions).toBe(4);
    expect(res.body.remainingSessions).toBe(6);
  });

  it('404 – subscription not found', async () => {
    mockSubRepo.findOneBy.mockResolvedValue(null);

    const res = await request(app).patch('/api/subscriptions/nonexistent/use');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Subscription not found/);
  });

  it('400 – subscription has expired', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({
      id: 'sub1',
      endDate: '2020-01-01',
      usedSessions: 0,
      totalSessions: 10,
    });

    const res = await request(app).patch('/api/subscriptions/sub1/use');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/);
  });

  it('400 – no remaining sessions', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({
      id: 'sub1',
      endDate: '2099-12-31',
      usedSessions: 10,
      totalSessions: 10,
    });

    const res = await request(app).patch('/api/subscriptions/sub1/use');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No remaining sessions/);
  });
});
