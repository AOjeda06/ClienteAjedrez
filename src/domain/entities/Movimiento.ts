/**
 * Entidad Movimiento
 * Representa un movimiento realizado en el tablero
 */

import { ID, Posicion } from '../types';

export interface MovimientoProps {
  id: ID;
  piezaId: ID;
  origen: Posicion;
  destino: Posicion;
  piezaCapturada?: ID | null;
  esEnroque?: boolean;
  esPromocion?: boolean;
  confirmado?: boolean;
}

export class Movimiento {
  id: ID;
  piezaId: ID;
  origen: Posicion;
  destino: Posicion;
  piezaCapturada: ID | null;
  esEnroque: boolean;
  esPromocion: boolean;
  confirmado: boolean;

  constructor(props: MovimientoProps) {
    this.id = props.id;
    this.piezaId = props.piezaId;
    this.origen = props.origen;
    this.destino = props.destino;
    this.piezaCapturada = props.piezaCapturada ?? null;
    this.esEnroque = props.esEnroque ?? false;
    this.esPromocion = props.esPromocion ?? false;
    this.confirmado = props.confirmado ?? false;
  }

  /**
   * Marca el movimiento como confirmado
   */
  confirmar(): void {
    this.confirmado = true;
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      piezaId: this.piezaId,
      origen: this.origen,
      destino: this.destino,
      piezaCapturada: this.piezaCapturada,
      esEnroque: this.esEnroque,
      esPromocion: this.esPromocion,
      confirmado: this.confirmado,
    };
  }

  /**
   * Crea una instancia desde un DTO
   * Acepta tanto camelCase como PascalCase en las propiedades entrantes
   */
  static createFromDTO(dto: any): Movimiento {
    // Aceptar PascalCase o camelCase
    const id = dto.id ?? dto.Id;
    const piezaId = dto.piezaId ?? dto.PiezaId;
    const origen = dto.origen ?? dto.Origen;
    const destino = dto.destino ?? dto.Destino;
    const piezaCapturada = dto.piezaCapturada ?? dto.PiezaCapturada ?? null;
    const esEnroque = dto.esEnroque ?? dto.EsEnroque ?? false;
    const esPromocion = dto.esPromocion ?? dto.EsPromocion ?? false;
    const confirmado = dto.confirmado ?? dto.Confirmado ?? false;

    if (!id || !piezaId || !origen || !destino) {
      throw new Error('DTO incompleto para crear Movimiento');
    }

    return new Movimiento({
      id,
      piezaId,
      origen,
      destino,
      piezaCapturada,
      esEnroque,
      esPromocion,
      confirmado,
    });
  }
}
