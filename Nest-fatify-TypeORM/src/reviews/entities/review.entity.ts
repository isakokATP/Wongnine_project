import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    comment: string;

    @Column({ type: 'decimal', precision: 2, scale: 1 })
    rating: number; // คะแนนรีวิวของ user คนนี้

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.reviews)
    user: User;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews)
    restaurant: Restaurant;
}