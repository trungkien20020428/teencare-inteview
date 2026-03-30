import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Parent } from './entities/Parent';
import { Student } from './entities/Student';
import { Class } from './entities/Class';
import { ClassRegistration } from './entities/ClassRegistration';
import { Subscription } from './entities/Subscription';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://teencare:teencare123@localhost:5432/teencare',
  synchronize: true,   // auto-create/update tables from entities
  logging: false,
  entities: [Parent, Student, Class, ClassRegistration, Subscription],
});
