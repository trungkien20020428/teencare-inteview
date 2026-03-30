import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ClassRegistration } from './ClassRegistration';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column()
  dayOfWeek: string;

  @Column()
  timeSlot: string;

  @Column()
  teacherName: string;

  @Column()
  maxStudents: number;

  @OneToMany(() => ClassRegistration, (r) => r.class)
  registrations: ClassRegistration[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
