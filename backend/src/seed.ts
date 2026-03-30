import { AppDataSource } from './data-source';
import { Parent } from './entities/Parent';
import { Student } from './entities/Student';
import { Class } from './entities/Class';
import { Subscription } from './entities/Subscription';

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to DB');

  const parentRepo = AppDataSource.getRepository(Parent);
  const studentRepo = AppDataSource.getRepository(Student);
  const classRepo = AppDataSource.getRepository(Class);
  const subRepo = AppDataSource.getRepository(Subscription);

  // Skip if data already seeded
  const existing = await parentRepo.count();
  if (existing > 0) {
    console.log('Seed data already present, skipping.');
    await AppDataSource.destroy();
    return;
  }

  // Parents
  const parent1 = await parentRepo.save({
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'nguyen.van.an@email.com',
  });
  const parent2 = await parentRepo.save({
    name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'tran.thi.binh@email.com',
  });
  console.log('Created 2 parents');

  // Students
  const student1 = await studentRepo.save({
    name: 'Nguyễn Minh Khoa',
    dob: '2008-03-15',
    gender: 'male',
    currentGrade: '10',
    parentId: parent1.id,
  });
  const student2 = await studentRepo.save({
    name: 'Nguyễn Thu Hà',
    dob: '2010-07-22',
    gender: 'female',
    currentGrade: '8',
    parentId: parent1.id,
  });
  const student3 = await studentRepo.save({
    name: 'Trần Quốc Bảo',
    dob: '2007-11-05',
    gender: 'male',
    currentGrade: '11',
    parentId: parent2.id,
  });
  console.log('Created 3 students');

  // Classes
  await classRepo.save([
    { name: 'Toán Đại Số Nâng Cao', subject: 'Toán', dayOfWeek: 'Monday',    timeSlot: '08:00-09:30', teacherName: 'Thầy Nguyễn Đức Hùng', maxStudents: 15 },
    { name: 'Vật Lý Cơ Bản',        subject: 'Vật Lý', dayOfWeek: 'Wednesday', timeSlot: '14:00-15:30', teacherName: 'Cô Lê Thị Mai',        maxStudents: 12 },
    { name: 'Tiếng Anh Giao Tiếp',  subject: 'Tiếng Anh', dayOfWeek: 'Friday',    timeSlot: '09:00-10:30', teacherName: 'Thầy David Johnson',  maxStudents: 10 },
  ]);
  console.log('Created 3 classes');

  // Subscriptions
  const today = new Date().toISOString().split('T')[0];
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  const endDate = threeMonths.toISOString().split('T')[0];

  await subRepo.save([
    { studentId: student1.id, packageName: 'Gói 20 Buổi', startDate: today, endDate, totalSessions: 20, usedSessions: 0 },
    { studentId: student2.id, packageName: 'Gói 10 Buổi', startDate: today, endDate, totalSessions: 10, usedSessions: 2 },
    { studentId: student3.id, packageName: 'Gói 20 Buổi', startDate: today, endDate, totalSessions: 20, usedSessions: 5 },
  ]);
  console.log('Created 3 subscriptions');

  console.log('Seed complete!');
  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
