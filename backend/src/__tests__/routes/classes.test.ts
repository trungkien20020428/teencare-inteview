import request from 'supertest';
import express from 'express';
import 'reflect-metadata';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

import classesRouter from '../../routes/classes';
import { AppDataSource } from '../../data-source';

const app = express();
app.use(express.json());
app.use('/api/classes', classesRouter);

// ─── Mock repos ──────────────────────────────────────────────────────────────

const mockQueryBuilder = {
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockClassRepo = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};
const mockStudentRepo = { findOneBy: jest.fn() };
const mockRegRepo = {
  findOneBy: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};
const mockSubRepo = { find: jest.fn() };

const entityMap: Record<string, any> = {
  Class: mockClassRepo,
  Student: mockStudentRepo,
  ClassRegistration: mockRegRepo,
  Subscription: mockSubRepo,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockClassRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => entityMap[entity.name] ?? {});
  (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn: any) =>
    fn({ save: jest.fn(), increment: jest.fn() })
  );
});

// ─── POST /api/classes ────────────────────────────────────────────────────────

describe('POST /api/classes', () => {
  const validPayload = {
    name: 'Toán 8A',
    subject: 'Math',
    dayOfWeek: 'Monday',
    timeSlot: '08:00-09:30',
    teacherName: 'Nguyen Van Giao',
    maxStudents: 20,
  };

  it('201 – creates class successfully', async () => {
    const cls = { id: 'c1', ...validPayload };
    mockClassRepo.save.mockResolvedValue(cls);

    const res = await request(app).post('/api/classes').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'c1', name: 'Toán 8A' });
  });

  it('400 – missing required field', async () => {
    const { name, ...rest } = validPayload;
    const res = await request(app).post('/api/classes').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('400 – invalid dayOfWeek', async () => {
    const res = await request(app).post('/api/classes').send({ ...validPayload, dayOfWeek: 'Funday' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dayOfWeek/);
  });

  it('400 – invalid timeSlot format (missing leading zeros)', async () => {
    const res = await request(app).post('/api/classes').send({ ...validPayload, timeSlot: '8:00-9:30' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/timeSlot/);
  });

  it('400 – invalid timeSlot format (wrong separator)', async () => {
    const res = await request(app).post('/api/classes').send({ ...validPayload, timeSlot: '08:00~09:30' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/timeSlot/);
  });
});

// ─── GET /api/classes ────────────────────────────────────────────────────────

describe('GET /api/classes', () => {
  it('200 – returns all classes with availableSlots', async () => {
    const classes = [
      { id: 'c1', name: 'Toán 8A', maxStudents: 20, enrolledCount: 5, dayOfWeek: 'Monday', timeSlot: '08:00-09:30' },
    ];
    mockQueryBuilder.getMany.mockResolvedValue(classes);

    const res = await request(app).get('/api/classes');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ id: 'c1', availableSlots: 15 });
  });

  it('200 – filters by day when ?day= query given', async () => {
    mockQueryBuilder.getMany.mockResolvedValue([]);

    await request(app).get('/api/classes?day=Monday');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('class.dayOfWeek = :day', { day: 'Monday' });
  });

  it('200 – enrolledCount defaults to 0 when undefined', async () => {
    const classes = [{ id: 'c1', maxStudents: 10, enrolledCount: undefined }];
    mockQueryBuilder.getMany.mockResolvedValue(classes);

    const res = await request(app).get('/api/classes');
    expect(res.body[0].availableSlots).toBe(10);
  });
});

// ─── POST /api/classes/:class_id/register ────────────────────────────────────

describe('POST /api/classes/:class_id/register', () => {
  const classId = 'c1';
  const studentId = 's1';
  const validSub = {
    id: 'sub1',
    studentId,
    packageName: 'Gói 10 Buổi',
    endDate: '2099-12-31',
    usedSessions: 3,
    totalSessions: 10,
  };

  const registrationAfterSave = {
    id: 'r1',
    classId,
    studentId,
    class: { id: classId, name: 'Toán 8A' },
    student: { id: studentId, name: 'Tran Thi B' },
  };

  function setupSuccessfulRegistration() {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId,
      name: 'Toán 8A',
      dayOfWeek: 'Monday',
      timeSlot: '08:00-09:30',
      maxStudents: 20,
      registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId, name: 'Tran Thi B' });
    mockRegRepo.findOneBy.mockResolvedValue(null);          // not yet registered
    mockRegRepo.find.mockResolvedValue([]);                 // no existing registrations for conflict check
    mockSubRepo.find.mockResolvedValue([validSub]);
    mockRegRepo.findOne.mockResolvedValue(registrationAfterSave);
  }

  it('201 – registers student and returns subscription info', async () => {
    setupSuccessfulRegistration();

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ classId, studentId });
    expect(res.body.subscriptionUsed).toMatchObject({ id: 'sub1', usedSessions: 4 });
  });

  it('400 – missing studentId', async () => {
    const res = await request(app).post(`/api/classes/${classId}/register`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/studentId/);
  });

  it('404 – class not found', async () => {
    mockClassRepo.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Class not found/);
  });

  it('409 – class is full', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId,
      maxStudents: 2,
      registrations: [{ id: 'r1' }, { id: 'r2' }],
    });

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/full/);
  });

  it('404 – student not found', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId, maxStudents: 20, registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Student not found/);
  });

  it('409 – student already registered in this class', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId, maxStudents: 20, registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId });
    mockRegRepo.findOneBy.mockResolvedValue({ id: 'r1', classId, studentId });

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/);
  });

  it('409 – time slot conflict with existing class on same day', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId,
      name: 'Toán 8A',
      dayOfWeek: 'Monday',
      timeSlot: '08:00-09:30',
      maxStudents: 20,
      registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId });
    mockRegRepo.findOneBy.mockResolvedValue(null);
    // Student already has a class on Monday 08:30-10:00 (overlaps with 08:00-09:30)
    mockRegRepo.find.mockResolvedValue([
      {
        classId: 'c2',
        studentId,
        class: { id: 'c2', name: 'Văn 8A', dayOfWeek: 'Monday', timeSlot: '08:30-10:00' },
      },
    ]);

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Time slot conflict/);
  });

  it('403 – no active subscription with remaining sessions', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId,
      name: 'Toán 8A',
      dayOfWeek: 'Monday',
      timeSlot: '08:00-09:30',
      maxStudents: 20,
      registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId });
    mockRegRepo.findOneBy.mockResolvedValue(null);
    mockRegRepo.find.mockResolvedValue([]);
    mockSubRepo.find.mockResolvedValue([]);  // no subscriptions

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no active subscription/i);
  });

  it('403 – subscription is expired', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId, name: 'Toán 8A', dayOfWeek: 'Monday', timeSlot: '08:00-09:30',
      maxStudents: 20, registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId });
    mockRegRepo.findOneBy.mockResolvedValue(null);
    mockRegRepo.find.mockResolvedValue([]);
    mockSubRepo.find.mockResolvedValue([
      { id: 'sub1', endDate: '2020-01-01', usedSessions: 0, totalSessions: 10 },
    ]);

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no active subscription/i);
  });

  it('403 – subscription sessions exhausted', async () => {
    mockClassRepo.findOne.mockResolvedValue({
      id: classId, name: 'Toán 8A', dayOfWeek: 'Monday', timeSlot: '08:00-09:30',
      maxStudents: 20, registrations: [],
    });
    mockStudentRepo.findOneBy.mockResolvedValue({ id: studentId });
    mockRegRepo.findOneBy.mockResolvedValue(null);
    mockRegRepo.find.mockResolvedValue([]);
    mockSubRepo.find.mockResolvedValue([
      { id: 'sub1', endDate: '2099-12-31', usedSessions: 10, totalSessions: 10 },
    ]);

    const res = await request(app)
      .post(`/api/classes/${classId}/register`)
      .send({ studentId });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no active subscription/i);
  });
});
