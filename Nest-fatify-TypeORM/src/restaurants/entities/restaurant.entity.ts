import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  openTime: string; // 'HH:mm'

  @Column({ type: 'varchar', length: 5, nullable: true })
  closeTime: string; // 'HH:mm'

  @Column({ type: 'boolean', default: false })
  isQuickMeal: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  // ลบ
  @Column({ type: 'int', default: 0 })
  averagePrice: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  minPrice: number;

  @Column({ type: 'int', nullable: true })
  maxPrice: number;

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  googleMapsUrl: string;

  @Column({ type: 'text', nullable: true })
  directionsText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  navigationType: string;

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
