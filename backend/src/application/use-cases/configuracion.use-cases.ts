import { Injectable, Inject } from '@nestjs/common';
import { TipoTramite, Area } from '@domain/entities';
import { v4 as uuid } from 'uuid';
import { CrearTipoTramiteDto, CrearAreaDto, ActualizarAreaDto } from '../dtos';
import { TIPO_TRAMITE_REPOSITORY, AREA_REPOSITORY } from '../ports/tokens';
import type { ITipoTramiteRepository } from '../ports/tipo-tramite.repository.port';
import type { IAreaRepository } from '../ports/area.repository.port';

@Injectable()
export class ConfiguracionUseCases {
  constructor(
    @Inject(TIPO_TRAMITE_REPOSITORY)
    private readonly tipoTramiteRepo: ITipoTramiteRepository,
    @Inject(AREA_REPOSITORY) private readonly areaRepo: IAreaRepository,
  ) {}

  listarTiposTramite() {
    return this.tipoTramiteRepo.findAll();
  }
  async crearTipoTramite(dto: CrearTipoTramiteDto) {
    return this.tipoTramiteRepo.create(
      TipoTramite.create({
        id: uuid(),
        ...dto,
        activo: true,
        areaInicialId: dto.areaInicialId ?? '',
      }),
    );
  }
  async actualizarTipoTramite(id: string, dto: Partial<CrearTipoTramiteDto>) {
    const e = await this.tipoTramiteRepo.findById(id);
    if (!e) throw new Error('No encontrado');
    return this.tipoTramiteRepo.update(TipoTramite.create({ ...e, ...dto }));
  }

  listarAreas() {
    return this.areaRepo.findAll();
  }
  crearArea(dto: CrearAreaDto) {
    return this.areaRepo.create(
      Area.create({ id: uuid(), ...dto, activa: true }),
    );
  }
  async actualizarArea(id: string, dto: ActualizarAreaDto) {
    const e = await this.areaRepo.findById(id);
    if (!e) throw new Error('No encontrado');
    return this.areaRepo.update(Area.create({ ...e, ...dto }));
  }
}
