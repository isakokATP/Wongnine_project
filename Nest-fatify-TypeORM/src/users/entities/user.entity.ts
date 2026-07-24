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

    @Column({ type: 'varchar', select: false, nullable: true })
    password: string | null;

    @Column({ type: 'varchar', default: UserRole.USER })
    role: UserRole;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Review, (review) => review.user)
    reviews?: Review[];
}