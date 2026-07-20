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
  UseInterceptors,
  UploadedFile,
  UploadedFiles
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateReviewForRestaurantDto } from '../reviews/dto/create-review-for-restaurant.dto';


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
  @Body() createReviewDto: CreateReviewForRestaurantDto,
) {
  return await this.reviewsService.create({
    ...createReviewDto,
    restaurantId: id,
  });
}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('capacity') capacity?: string,
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
      isQuickMealBool,
    );
  }

  @Get(':id/reviews')
  async getReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.reviewsService.findByRestaurant(id, +page, +limit);
  }

  // @Post('upload-image')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, callback) => {
  //         const uniqueSuffix =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         const ext = extname(file.originalname);
  //         callback(null, `${uniqueSuffix}${ext}`);
  //       },
  //     }),
  //   }),
  // )
  // uploadImage(@UploadedFile() file: Express.Multer.File) {
  //   return {
  //     imageUrl: `/uploads/${file.filename}`,
  //   };
  // }

  @Post('upload-images')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return {
      imageUrls: files.map((file) => `/uploads/${file.filename}`),
    };
  }
}
