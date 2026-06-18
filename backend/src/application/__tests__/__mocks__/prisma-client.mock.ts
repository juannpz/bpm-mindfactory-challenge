/// <reference types="jest" />

export class PrismaClient {
  $transaction: jest.Mock;
  constructor() {
    this.$transaction = jest.fn();
  }
}
