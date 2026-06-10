// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
      user: this.toAuthUser(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toAuthUser(user);
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    };
  }

  async register(registerDto: RegisterDto, adminSecret?: string) {
    // Check for existing active user
    const activeUser = await this.usersRepository.findOne({
      where: { email: registerDto.email, isActive: true }
    });
    
    if (activeUser) {
      throw new BadRequestException('Email already in use');
    }

    // Check for soft-deleted user
    const deletedUser = await this.usersRepository.findOne({
      where: { email: registerDto.email, isActive: false },
      withDeleted: true
    });

    // Verify admin secret if provided
    const isAdmin = adminSecret && adminSecret === this.configService.get('ADMIN_SECRET');
    if (adminSecret && !isAdmin) {
      throw new BadRequestException('Invalid admin secret');
    }

    if (deletedUser) {
      // Reactivate the user with new details
      deletedUser.name = registerDto.name;
      deletedUser.password = await this.hashPassword(registerDto.password);
      deletedUser.isActive = true;
      deletedUser.deletedAt = null;
      deletedUser.isAdmin = isAdmin; // Set admin status
      
      return this.usersRepository.save(deletedUser);
    }

    // Create new user if no existing record found
    const user = this.usersRepository.create({
      ...registerDto,
      isAdmin, // Set admin status for new user
    });

    // Hash the password before saving
    user.password = await this.hashPassword(registerDto.password);
    
    return this.usersRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}