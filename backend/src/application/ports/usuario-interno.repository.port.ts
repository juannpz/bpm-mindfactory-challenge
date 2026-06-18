import { UsuarioInterno } from '@domain/entities';

export interface IUsuarioInternoRepository {
  findById(id: string): Promise<UsuarioInterno | null>;
  findByAzureObjectId(azureObjectId: string): Promise<UsuarioInterno | null>;
  findByAreaId(areaId: string): Promise<UsuarioInterno[]>;
}
