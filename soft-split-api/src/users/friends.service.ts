import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { FriendRequest } from './entities/friend-request.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
  ) {}

  async searchUserByEmail(email: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ 
      where: { 
        email,
        isActive: true // Only find active users
      },
      select: ['id', 'email', 'name', 'avatar']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    };
  }

  async sendFriendRequest(senderId: string, receiverEmail: string) {
    if (!receiverEmail) {
      throw new BadRequestException('Receiver email is required');
    }
    
    console.log(`Sending friend request from ${senderId} to ${receiverEmail}`);

    const sender = await this.usersRepository.findOne({
      where: { id: senderId, isActive: true }
    });

    if (!sender) {
      throw new NotFoundException('Sender not found or inactive');
    }

    const receiver = await this.usersRepository.findOne({
      where: { 
        email: receiverEmail,
        isActive: true 
      }
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found or inactive');
    }

    // Prevent self-friend requests
    if (senderId === receiver.id) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if request already exists
    const existingRequest = await this.friendRequestRepository.findOne({
      where: [
        { 
          sender: { id: senderId }, 
          receiver: { id: receiver.id },
          status: 'pending'
        },
        { 
          sender: { id: receiver.id }, 
          receiver: { id: senderId },
          status: 'pending'
        }
      ],
      relations: ['sender', 'receiver']
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const request = this.friendRequestRepository.create({
      sender: { id: senderId },
      receiver: { id: receiver.id },
      status: 'pending'
    });

    const savedRequest = await this.friendRequestRepository.save(request);
    console.log('Saved friend request:', savedRequest);

    return savedRequest;
  }

  async respondToFriendRequest(userId: string, requestId: string, accept: boolean) {
    // Find the request and load relations
    const request = await this.friendRequestRepository.findOne({
      where: { id: requestId, receiver: { id: userId } },
      relations: ['sender', 'receiver']
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify the user is the receiver
    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Not authorized to respond to this request');
    }

    if (accept) {
      // Update request status
      request.status = 'accepted';
      await this.friendRequestRepository.save(request);

      // Add both users as friends
      const sender = await this.usersRepository.findOne({
        where: { id: request.sender.id },
        relations: ['friends']
      });
      const receiver = await this.usersRepository.findOne({
        where: { id: request.receiver.id },
        relations: ['friends']
      });

      if (!sender || !receiver) {
        throw new NotFoundException('User not found');
      }

      // Add to friends list bidirectionally
      if (!sender.friends) sender.friends = [];
      if (!receiver.friends) receiver.friends = [];
      
      sender.friends.push(receiver);
      receiver.friends.push(sender);

      await this.usersRepository.save([sender, receiver]);
    } else {
      // If rejected, just update the status
      request.status = 'rejected';
      await this.friendRequestRepository.save(request);
    }

    return request;
  }

  async getFriends(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['friends'],
      select: ['id', 'friends'] // Only select what we need from the main user
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Map friends to only return safe fields
    return user.friends.map(friend => ({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      avatar: friend.avatar
    }));
  }

  async getPendingRequests(userId: string) {
    // Get user with relations
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['sentFriendRequests', 'receivedFriendRequests', 
        'sentFriendRequests.receiver', 'receivedFriendRequests.sender']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter pending requests and transform the response
    const sentRequests = user.sentFriendRequests
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request.id,
        receiver: {
          id: request.receiver.id,
          name: request.receiver.name,
          email: request.receiver.email,
          avatar: request.receiver.avatar
        },
        createdAt: request.createdAt,
        status: request.status
      }));

    const receivedRequests = user.receivedFriendRequests
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request.id,
        sender: {
          id: request.sender.id,
          name: request.sender.name,
          email: request.sender.email,
          avatar: request.sender.avatar
        },
        createdAt: request.createdAt,
        status: request.status
      }));

    return {
      sentRequests,
      receivedRequests
    };
  }
} 