import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    
    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

        const newUser = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return await this.userRepository.save(newUser);
    }

    async findAll(): Promise<User[]> {
        // password ไม่ติดมาอยู่แล้วเพราะ select:false ที่ entity
        return await this.userRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // ใช้เฉพาะตอน login เท่านั้น เพราะต้อง select password มาเทียบ
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.userRepository.findOneBy({ email: updateUserDto.email });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        // ถ้ามีการเปลี่ยน password ต้อง hash ใหม่ก่อนบันทึกเสมอ
        const updateData: any = { ...updateUserDto };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        const updated = Object.assign(user, updateData);
        return await this.userRepository.save(updated);
    }

    async remove(id: number): Promise<{ message: string }> {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
        return { message: 'User removed successfully' };
    }
}