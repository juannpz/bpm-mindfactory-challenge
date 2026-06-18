export interface IUnitOfWork {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('IUnitOfWork');
