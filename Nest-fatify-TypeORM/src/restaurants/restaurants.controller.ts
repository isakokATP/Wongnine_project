import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Inject,
  forwardRef,
  Query,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ReviewsService } from '../reviews/reviews.service';

@Controller('restaurants') // http://localhost:3000/restaurants
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,

    @Inject(forwardRef(() => ReviewsService))
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return await this.restaurantsService.create(createRestaurantDto);
  }

  // @Get()
  // async findAll() {
  //   return await this.restaurantsService.findAll();
  // }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return await this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.restaurantsService.delete(id);
  }

  @Post(':id/reviews')
  async createReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    // ensure restaurantId is set on the DTO and delegate to ReviewsService
    createReviewDto.restaurantId = id;
    return await this.reviewsService.create(createReviewDto);
  }

  // @Get(':id/reviews')
  // async getReviews(@Param('id', ParseIntPipe) id: number) {
  //   return await this.reviewsService.findByRestaurant(id);
  // }

@Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('capacity') capacity?: string,
    @Query('meal') meal?: string,
    @Query('isQuickMeal') isQuickMeal?: string,
  ) {
    let isQuickMealBool: boolean | undefined = undefined;
    if (isQuickMeal === 'true') isQuickMealBool = true;
    if (isQuickMeal === 'false') isQuickMealBool = false;

    return this.restaurantsService.findAll(
      +page,
      +limit,
      search,
      category,
      minPrice ? +minPrice : undefined,
      maxPrice ? +maxPrice : undefined,
      capacity ? +capacity : undefined,
      meal,
      isQuickMealBool
    );
  }

  @Get(':id/reviews')
  async getReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return await this.reviewsService.findByRestaurant(id, +page, +limit);
  }
}
