import request from 'supertest';
import express from 'express';
import 'reflect-metadata';

// Mock data-source before importing routes
jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

// Mock timeUtils so we can control refund eligibility
jest.mock('../../utils/timeUtils', () => ({
  isEligibleForRefund: jest.fn(),
}));

import registrationsRouter from '../../routes/registrations';
import { AppDataSource } from '../../data-source';
import { isEligibleForRefund } from '../../utils/timeUtils';

const app = express();
app.use(express.json());
app.use('/api/registrations', registrationsRouter);

const mockRegRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};
const mockSubRepo = {
  findOne: jest.fn(),
  decrement: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
    if (entity.name === 'ClassRegistration') return mockRegRepo;
    if (entity.name === 'Subscription') return mockSubRepo;
    return {};
  });
  (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn: any) =>
    fn({ remove: jest.fn(), decrement: jest.fn() })
  );
});

// ─── GET /api/registrations ──────────────────────────────────────────────────

describe('GET /api/registrations', () => {
  it('200 – returns all registrations', async () => {
    const regs = [{ id: 'r1', classId: 'c1', studentId: 's1' }];
    mockRegRepo.find.mockResolvedValue(regs);

    const res = await request(app).get('/api/registrations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('200 – filters by studentId', async () => {
    mockRegRepo.find.mockResolvedValue([]);

    await request(app).get('/api/registrations?studentId=s1');
    expect(mockRegRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 's1' } })
    );
  });

  it('200 – filters by classId', async () => {
    mockRegRepo.find.mockResolvedValue([]);

    await request(app).get('/api/registrations?classId=c1');
    expect(mockRegRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { classId: 'c1' } })
    );
  });
});

// ─── DELETE /api/registrations/:id ───────────────────────────────────────────

describe('DELETE /api/registrations/:id', () => {
  const registration = {
    id: 'r1',
    classId: 'c1',
    studentId: 's1',
    class: { id: 'c1', name: 'Toán 8A', dayOfWeek: 'Monday', timeSlot: '14:00-15:30' },
    student: { id: 's1', name: 'Tran Thi B' },
  };

  it('404 – registration not found', async () => {
    mockRegRepo.findOne.mockResolvedValue(null);

    const res = await request(app).delete('/api/registrations/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Registration not found/);
  });

  it('200 – cancels and refunds session when > 24h before class', async () => {
    mockRegRepo.findOne.mockResolvedValue(registration);
    (isEligibleForRefund as jest.Mock).mockReturnValue(true);

    const mockManager = { remove: jest.fn(), decrement: jest.fn() };
    mockSubRepo.findOne.mockResolvedValue({ id: 'sub1', usedSessions: 5 });
    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn: any) =>
      fn(mockManager)
    );

    const res = await request(app).delete('/api/registrations/r1');

    expect(res.status).toBe(200);
    expect(res.body.refunded).toBe(true);
    expect(res.body.message).toMatch(/refunded/i);
    expect(isEligibleForRefund).toHaveBeenCalledWith('Monday', '14:00-15:30');
  });

  it('200 – cancels without refund when < 24h before class', async () => {
    mockRegRepo.findOne.mockResolvedValue(registration);
    (isEligibleForRefund as jest.Mock).mockReturnValue(false);
    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn: any) =>
      fn({ remove: jest.fn(), decrement: jest.fn() })
    );

    const res = await request(app).delete('/api/registrations/r1');

    expect(res.status).toBe(200);
    expect(res.body.refunded).toBe(false);
    expect(res.body.message).toMatch(/No refund/i);
  });

  it('200 – response includes studentName and className', async () => {
    mockRegRepo.findOne.mockResolvedValue(registration);
    (isEligibleForRefund as jest.Mock).mockReturnValue(false);
    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn: any) =>
      fn({ remove: jest.fn(), decrement: jest.fn() })
    );

    const res = await request(app).delete('/api/registrations/r1');

    expect(res.body.studentName).toBe('Tran Thi B');
    expect(res.body.className).toBe('Toán 8A');
  });
});
