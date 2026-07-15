import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    @Inject(forwardRef(() => RestaurantsService))
    private restaurantsService: RestaurantsService,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, comment, rating, restaurantId, newRestaurant, imageUrls } =
      createReviewDto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานนี้ในระบบ');

    let targetRestaurant: Restaurant;

    if (restaurantId) {
      const found = await this.restaurantsService.findOne(restaurantId);
      if (!found) throw new NotFoundException('ไม่พบร้านอาหารที่ระบุ');
      targetRestaurant = found;
    } else if (newRestaurant) {
      targetRestaurant = await this.restaurantsService.create(newRestaurant);
    } else {
      throw new BadRequestException(
        'ต้องระบุ restaurantId หรือ newRestaurant อย่างใดอย่างหนึ่ง',
      );
    }

    const newReview = new Review();
    newReview.comment = comment;
    newReview.rating = rating;
    newReview.imageUrls = imageUrls || [];
    newReview.user = user!;
    newReview.restaurant = targetRestaurant;

    const savedReview = await this.reviewRepository.save(newReview);

    const allReviews = await this.reviewRepository.find({
      where: { restaurant: { id: targetRestaurant.id } },
    });

    const totalScore = allReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    let averageRating = totalScore / allReviews.length;

    averageRating = Math.round(averageRating * 10) / 10;
    await this.restaurantsService.updateRating(
      targetRestaurant.id,
      averageRating,
    );
    savedReview.restaurant.rating = averageRating;

    return savedReview;
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: { user: true, restaurant: true },
    });
    if (review) throw new NotFoundException('Review Notfound: ${id}');
    return review!;
  }

  // async findAll(): Promise<Review[]> {
  //   return await this.reviewRepository.find({
  //     relations: { user: true, restaurant: true },
  //   });
  // }

  // async findByRestaurant(restaurantId: number): Promise<Review[]> {
  //   return await this.reviewRepository.find({
  //     where: { restaurant: { id: restaurantId } },
  //     relations: {
  //       user: true,
  //     },
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  async update(id: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const { userId, comment, rating } = updateReviewDto;

    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        user: true,
        restaurant: true,
      },
    });

    if (!review) throw new NotFoundException('Not found your review!!!');

    if (!review.user || review.user.id !== userId) {
      throw new ForbiddenException(
        'Cant verification or You cant access this review',
      );
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    let isRatingChanged = false;
    if (rating !== undefined && Number(review.rating) !== rating) {
      review.rating = rating;
      isRatingChanged = true;
    }

    const updateReview = await this.reviewRepository.save(review);

    if (isRatingChanged) {
      const allReviews = await this.reviewRepository.find({
        where: { restaurant: { id: review.restaurant.id } },
      });
      const totalScore = allReviews.reduce(
        (sum, r) => sum + Number(r.rating),
        0,
      );
      let averageRating = totalScore / allReviews.length;

      averageRating = Math.round(averageRating * 10) / 10;

      await this.restaurantsService.updateRating(
        review.restaurant.id,
        averageRating,
      );

      updateReview.restaurant.rating = averageRating;
    }
    return updateReview;
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        user: true,
        restaurant: true,
      },
    });

    if (!review) throw new NotFoundException('NotFound Your review to Delete');

    if (review.user.id !== userId) {
      throw new ForbiddenException('Your cant delete other review');
    }

    const restaurantId = review.restaurant.id;
    await this.reviewRepository.remove(review);

    const allReviews = await this.reviewRepository.find({
      where: { restaurant: { id: restaurantId } },
    });

    let averageRating = 0;

    if (allReviews.length > 0) {
      const totalScore = allReviews.reduce(
        (sum, r) => sum + Number(r.rating),
        0,
      );
      averageRating = totalScore / allReviews.length;
      averageRating = Math.round(averageRating * 10) / 10;
    }

    await this.restaurantsService.updateRating(restaurantId, averageRating);

    return { message: 'Your review has been deleted' };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      skip: skip,
      take: limit,
      relations: {
        user: true,
        restaurant: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: totalPages,
        currentPage: page,
      },
    };
  }

  async findByRestaurant(
    restaurantId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { restaurant: { id: restaurantId } },
      relations: {
        user: true,
      },
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: totalPages,
        currentPage: page,
      },
    };
  }

  async findByUser(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { user: { id: userId } },
      relations: {
        restaurant: true,
      },
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: totalPages,
        currentPage: page,
      },
    };
  }
}
