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
   */
  static createFromDTO(dto: {
    id?: ID;
    piezaId?: ID;
    origen?: Posicion;
    destino?: Posicion;
    piezaCapturada?: ID | null;
    esEnroque?: boolean;
    esPromocion?: boolean;
    confirmado?: boolean;
  }): Movimiento {
    if (!dto.id || !dto.piezaId || !dto.origen || !dto.destino) {
      throw new Error('DTO incompleto para crear Movimiento');
    }
    return new Movimiento({
      id: dto.id,
      piezaId: dto.piezaId,
      origen: dto.origen,
      destino: dto.destino,
      piezaCapturada: dto.piezaCapturada,
      esEnroque: dto.esEnroque,
      esPromocion: dto.esPromocion,
      confirmado: dto.confirmado,
    });
  }
}
