import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Unique,
} from 'typeorm';
import { Class } from './Class';
import { Student } from './Student';

@Entity('class_registrations')
@Unique(['classId', 'studentId'])
export class ClassRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Class, (c) => c.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @ManyToOne(() => Student, (s) => s.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @CreateDateColumn()
  registeredAt: Date;
}
