import { AccionMovimiento, EstadoTramite, OrigenTramite } from '../enums';

export class TransicionValidatorService {
  private static readonly transicionesPorOrigen: Record<
    OrigenTramite,
    Partial<Record<EstadoTramite, AccionMovimiento[]>>
  > = {
    [OrigenTramite.INTERNO_INTERNO]: {
      [EstadoTramite.BORRADOR]: [
        AccionMovimiento.INGRESAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.INGRESADO]: [
        AccionMovimiento.TOMAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.EN_REVISION]: [
        AccionMovimiento.DERIVAR,
        AccionMovimiento.ASIGNAR,
        AccionMovimiento.OBSERVAR,
        AccionMovimiento.APROBAR,
        AccionMovimiento.RECHAZAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.OBSERVADO]: [AccionMovimiento.CANCELAR],
      [EstadoTramite.APROBADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.RECHAZADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CANCELADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CERRADO]: [],
    },
    [OrigenTramite.INTERNO_EXTERNO]: {
      [EstadoTramite.BORRADOR]: [
        AccionMovimiento.INGRESAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.INGRESADO]: [
        AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.EN_REVISION]: [
        AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        AccionMovimiento.OBSERVAR,
        AccionMovimiento.APROBAR,
        AccionMovimiento.RECHAZAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.ESPERANDO_EXTERNO]: [
        AccionMovimiento.RESPONDER_INTERVENCION_EXTERNA,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.ESPERANDO_INTERNO]: [
        AccionMovimiento.TOMAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.OBSERVADO]: [AccionMovimiento.CANCELAR],
      [EstadoTramite.APROBADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.RECHAZADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CANCELADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CERRADO]: [],
    },
    [OrigenTramite.EXTERNO_INTERNO]: {
      [EstadoTramite.BORRADOR]: [
        AccionMovimiento.INGRESAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.INGRESADO]: [
        AccionMovimiento.TOMAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.EN_REVISION]: [
        AccionMovimiento.OBSERVAR,
        AccionMovimiento.ASIGNAR,
        AccionMovimiento.APROBAR,
        AccionMovimiento.RECHAZAR,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.OBSERVADO]: [
        AccionMovimiento.RESPONDER_OBSERVACION,
        AccionMovimiento.CANCELAR,
      ],
      [EstadoTramite.APROBADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.RECHAZADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CANCELADO]: [AccionMovimiento.CERRAR],
      [EstadoTramite.CERRADO]: [],
    },
  };

  static puedeTransicionar(
    origen: OrigenTramite,
    estado: EstadoTramite,
    accion: AccionMovimiento,
  ): boolean {
    const mapa = TransicionValidatorService.transicionesPorOrigen[origen];
    if (!mapa) return false;
    const acciones = mapa[estado];
    if (!acciones) return false;
    return acciones.includes(accion);
  }

  static accionesDisponibles(
    origen: OrigenTramite,
    estado: EstadoTramite,
  ): AccionMovimiento[] {
    const mapa = TransicionValidatorService.transicionesPorOrigen[origen];
    return mapa?.[estado] ?? [];
  }
}
