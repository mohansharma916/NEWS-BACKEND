import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Adjust path to your PrismaService
import { CreateSubscribeNewsletterDto } from './dto/create-subscribe-newsletter.dto';

@Injectable()
export class SubscribeNewslettersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSubscribeNewsletterDto) {
    // 1. Check if email exists in the database (even if unsubscribed)
    const existingSubscriber = await this.prisma.subscriber.findUnique({
      where: { email: createDto.email },
    });

    if (existingSubscriber) {
      // 2a. If they exist and are active, throw error
      if (existingSubscriber.isActive) {
        throw new ConflictException('This email is already subscribed to the newsletter.');
      }

      // 2b. If they exist but unsubscribed previously, re-activate them
      return this.prisma.subscriber.update({
        where: { email: createDto.email },
        data: {
          isActive: true,
          unsubscribedAt: null, // Reset unsubscription date
        },
      });
    }

    // 3. If new email, create the record
    return this.prisma.subscriber.create({
      data: {
        email: createDto.email,
        isActive: true,
      },
    });
  }

  findAll() {
    return this.prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }

    return subscriber;
  }

  /**
   * Handles user unsubscription (soft delete: sets isActive to false)
   */
  async unsubscribe(id: string) {
    const subscriber = await this.findOne(id);

    if (!subscriber.isActive) {
      // Already unsubscribed, no need to update
      return subscriber;
    }

    return this.prisma.subscriber.update({
      where: { id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(), // Set the date of unsubscription
      },
    });
  }
}