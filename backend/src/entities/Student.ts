import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Parent } from './Parent';
import { ClassRegistration } from './ClassRegistration';
import { Subscription } from './Subscription';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  dob: string;

  @Column()
  gender: string;

  @Column()
  currentGrade: string;

  @Column()
  parentId: string;

  @ManyToOne(() => Parent, (p) => p.students, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @OneToMany(() => ClassRegistration, (r) => r.student)
  registrations: ClassRegistration[];

  @OneToMany(() => Subscription, (s) => s.student)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
