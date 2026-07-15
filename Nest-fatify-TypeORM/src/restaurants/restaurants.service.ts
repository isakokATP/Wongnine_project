import {
  Injectable,
  NotFoundException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @Inject(forwardRef(() => ReviewsService))
    private readonly reviewsService: ReviewsService,

    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    const { reviewUserId, reviewRating, reviewComment, reviewImageUrls, ...restaurantData } =
      createRestaurantDto;

    const existingRestaurant = await this.restaurantRepository.findOneBy({
      name: restaurantData.name,
      latitude: restaurantData.latitude,
      longitude: restaurantData.longitude,
    });
    if (existingRestaurant) {
      throw new ConflictException(
        'Restaurant with this name already exists at this location',
      );
    }

    if (reviewRating !== undefined) {
      (restaurantData as Partial<Restaurant>).rating = reviewRating;
    }

    const newRestaurant = this.restaurantRepository.create(
      restaurantData as Partial<Restaurant>,
    );
    const savedRestaurant = await this.restaurantRepository.save(newRestaurant);

    if (reviewUserId && reviewRating !== undefined && reviewComment) {
      await this.reviewsService.create({
        userId: reviewUserId,
        restaurantId: savedRestaurant.id,
        rating: reviewRating,
        comment: reviewComment,
        imageUrls: reviewImageUrls,   // ส่งต่อรูปรีวิวเข้าไปด้วย
      });
    }

    return savedRestaurant;
}

  async findOne(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: id },
      relations: {
        reviews: {
          user: true,
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async delete(id: number): Promise<{ message: string }> {
    const restaurant = await this.findOne(id);
    await this.restaurantRepository.remove(restaurant);
    return { message: 'Restaurant removed successfully' };
  }

  async updateRating(id: number, newRating: number): Promise<void> {
    await this.restaurantRepository.update(id, { rating: newRating });
  }

  // async findAll(
  //   page: number = 1,
  //   limit: number = 10,
  //   search?: string,
  //   category?: string,
  //   minPrice?: number,
  //   maxPrice?: number,
  //   capacity?: number,
  //   meal?: string,
  //   isQuickMeal?: boolean,
  // ) {
  //   const skip = (page - 1) * limit;
  //   const query = this.restaurantRepository.createQueryBuilder('restaurant');

  //   if (search) {
  //     query.andWhere(
  //       '(LOWER(restaurant.name) LIKE LOWER(:search) OR LOWER(restaurant.category) LIKE LOWER(:search) OR LOWER(restaurant.address) LIKE LOWER(:search))',
  //       { search: `%${search}%` },
  //     );
  //   }
  //   if (category) {
  //     query.andWhere('restaurant.category = :category', { category });
  //   }
  //   if (minPrice !== undefined) {
  //     query.andWhere('restaurant.averagePrice >= :minPrice', { minPrice });
  //   }
  //   if (maxPrice !== undefined) {
  //     query.andWhere('restaurant.averagePrice <= :maxPrice', { maxPrice });
  //   }
  //   if (capacity !== undefined) {
  //     query.andWhere('restaurant.capacity >= :capacity', { capacity });
  //   }

  //   if (meal === 'breakfast') {
  //     query.andWhere('restaurant.isBreakfast = :isTrue', { isTrue: true });
  //   } else if (meal === 'lunch') {
  //     query.andWhere('restaurant.isLunch = :isTrue', { isTrue: true });
  //   } else if (meal === 'dinner') {
  //     query.andWhere('restaurant.isDinner = :isTrue', { isTrue: true });
  //   }

  //   if (isQuickMeal !== undefined) {
  //     query.andWhere('restaurant.isQuickMeal = :isQuickMeal', { isQuickMeal });
  //   }

  //   query.orderBy('restaurant.createdAt', 'DESC').skip(skip).take(limit);

  //   const [data, total] = await query.getManyAndCount();
  //   const totalPages = Math.ceil(total / limit);

  //   let alertMessage: string | null = null;
  //   if (capacity && capacity >= 10) {
  //     alertMessage =
  //       'เราคัดกรองเฉพาะร้านที่มีพื้นที่รองรับกลุ่ม 10 คนขึ้นไปมาให้คุณแล้ว';
  //   }

  //   return {
  //     data: data,
  //     meta: {
  //       totalItems: total,
  //       itemCount: data.length,
  //       itemsPerPage: limit,
  //       totalPages: totalPages,
  //       currentPage: page,
  //       alertMessage: alertMessage, // ส่งข้อความแนบไปให้หน้าบ้านโชว์ด้วย
  //     },
  //   };
  // }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    capacity?: number,
    isQuickMeal?: boolean,
  ) {
    const queryBuilder =
      this.restaurantRepository.createQueryBuilder('restaurant');
    if (search) {
      queryBuilder.andWhere(
        '(restaurant.name ILIKE :search OR restaurant.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('restaurant.category = :category', { category });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('restaurant.maxPrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('restaurant.minPrice <= :maxPrice', { maxPrice });
    }

    if (capacity !== undefined) {
      queryBuilder.andWhere('restaurant.capacity >= :capacity', { capacity });
    }

    // ลบ if (meal) { ... } ทิ้งทั้งหมด

    if (isQuickMeal !== undefined) {
      queryBuilder.andWhere('restaurant.isQuickMeal = :isQuickMeal', {
        isQuickMeal,
      });
    }

    queryBuilder.orderBy('restaurant.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: number,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const { address, rating, navigationType, googleMapsUrl, directionsText } =
      updateRestaurantDto as any;

    const toUpdate: Partial<Restaurant> = {
      id,
      ...(address !== undefined ? { address } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(navigationType !== undefined ? { navigationType } : {}),
      ...(googleMapsUrl !== undefined ? { googleMapsUrl } : {}),
      ...(directionsText !== undefined ? { directionsText } : {}),
    };

    const preloaded = await this.restaurantRepository.preload(toUpdate);
    if (!preloaded) {
      throw new NotFoundException('Restaurant not found');
    }

    await this.restaurantRepository.save(preloaded);

    return await this.findOne(id);
  }
}
