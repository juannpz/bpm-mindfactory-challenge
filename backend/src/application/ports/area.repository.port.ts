import { Area } from '@domain/entities';

export interface IAreaRepository {
  findById(id: string): Promise<Area | null>;
  findAll(): Promise<Area[]>;
  create(area: Area): Promise<Area>;
  update(area: Area): Promise<Area>;
}
