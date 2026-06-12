import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let configService: any;
  let usersRepository: any;
  let resetTokensRepo: any;
  let emailService: any;

  beforeEach(async () => {
    usersService = { findOne: jest.fn(), findByEmail: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    configService = { get: jest.fn() };
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'u1', ...data })),
    };
    resetTokensRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 't1', ...data })),
    };
    emailService = {
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: resetTokensRepo,
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns the user (without the password field) on correct credentials', async () => {
      const hashed = await bcrypt.hash('correct-pw', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hashed,
        name: 'A',
      });

      const result = await service.validateUser('a@b.com', 'correct-pw');

      expect(result).toBeTruthy();
      expect(result.id).toBe('u1');
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when the password does not match', async () => {
      const hashed = await bcrypt.hash('correct-pw', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hashed,
      });

      const result = await service.validateUser('a@b.com', 'wrong-pw');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns { access_token, user } and never includes the password field', async () => {
      const result = await service.login({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
        isAdmin: false,
      });

      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: 'u1',
        name: 'A',
        email: 'a@b.com',
        avatar: null,
        isAdmin: false,
      });
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('register', () => {
    it('hashes the password before saving (the stored value is not plaintext)', async () => {
      // No existing active user, no soft-deleted user.
      usersRepository.findOne.mockResolvedValue(null);

      await service.register({
        name: 'Newbie',
        email: 'newbie@test.com',
        password: 'plain-pw',
      });

      expect(usersRepository.save).toHaveBeenCalled();
      const savedArg = usersRepository.save.mock.calls[0][0];
      expect(savedArg.password).not.toBe('plain-pw');
      // bcrypt hash check: matches the input.
      await expect(bcrypt.compare('plain-pw', savedArg.password)).resolves.toBe(
        true,
      );
    });

    it('rejects registering when an active user with that email already exists', async () => {
      usersRepository.findOne.mockResolvedValueOnce({
        id: 'existing',
        email: 'taken@test.com',
        isActive: true,
      });

      await expect(
        service.register({
          name: 'Dup',
          email: 'taken@test.com',
          password: 'plain-pw',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
