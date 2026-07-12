import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  OWNER = 'owner'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ unique: true })
    email: string;

    // select: false = query ปกติ (find, findOne) จะไม่ดึง password ออกมาด้วย
    // ต้องระบุ .addSelect('user.password') ตอน query ตอน login เท่านั้นถึงจะเห็นค่านี้
    @Column({ type: 'varchar', select: false })
    password: string;

    @Column({ type: 'varchar', default: UserRole.USER })
    role: UserRole;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Review, (review) => review.user)
    reviews?: Review[];
}