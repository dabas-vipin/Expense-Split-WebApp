// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokensRepo: Repository<PasswordResetToken>,
    private emailService: EmailService,
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

    const saved = await this.usersRepository.save(user);

    // Welcome email — non-fatal so a misconfigured SMTP can't block signup.
    try {
      await this.emailService.sendWelcome(saved.email, saved.name);
    } catch {
      // intentionally swallowed
    }

    return saved;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Generate a single-use password-reset token, store it, and email the link.
   *
   * Always resolves successfully even if the email is not associated with an
   * account — telling the caller "no such user" is enumeration. The email
   * silently doesn't go out in that case.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.resetTokensRepo.save(
      this.resetTokensRepo.create({ user, token, expiresAt, used: false }),
    );

    const frontendBase =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:3000';
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;

    try {
      await this.emailService.sendPasswordReset(user.email, user.name, resetUrl);
    } catch {
      // non-fatal — token is still valid via the link if the operator
      // retrieves it from the email-service logs.
    }
  }

  /**
   * Confirm a password reset: verify the token is unexpired and unused, then
   * hash and store the new password and mark the token used.
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const record = await this.resetTokensRepo.findOne({
      where: { token },
    });
    if (!record || record.used || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    const user = await this.usersRepository.findOne({
      where: { id: record.user.id },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    user.password = await this.hashPassword(newPassword);
    await this.usersRepository.save(user);

    record.used = true;
    await this.resetTokensRepo.save(record);
  }
}