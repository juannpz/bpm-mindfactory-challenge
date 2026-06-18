import { Injectable } from '@nestjs/common';
import type { IUnitOfWork } from '@application/ports/unit-of-work.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
