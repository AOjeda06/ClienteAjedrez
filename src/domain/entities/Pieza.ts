/**
 * Entidad Pieza
 * Representa una pieza de ajedrez en el tablero
 */

import { ID, Color, TipoPieza, Posicion } from '../types';

export interface PiezaProps {
  id: ID;
  tipo: TipoPieza;
  color: Color;
  posicion: Posicion;
  eliminada?: boolean;
}

export class Pieza {
  id: ID;
  tipo: TipoPieza;
  color: Color;
  posicion: Posicion;
  eliminada: boolean;

  /**
   * Piezas blancas nunca se han movido si están en fila 1
   * Piezas negras nunca se han movido si están en fila 6
   * Esta propiedad se usa para validar el enroque
   */
  nunca_ha_movido: boolean;

  constructor(props: PiezaProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.color = props.color;
    this.posicion = props.posicion;
    this.eliminada = props.eliminada ?? false;

    // Determina si la pieza nunca se ha movido según su posición inicial
    if (props.color === 'Blanca' && props.posicion.fila === 7) {
      this.nunca_ha_movido = true;
    } else if (props.color === 'Negra' && props.posicion.fila === 0) {
      this.nunca_ha_movido = true;
    } else {
      this.nunca_ha_movido = false;
    }
  }

  /**
   * Mueve la pieza a una nueva posición
   */
  mover(nuevaPosicion: Posicion): void {
    this.posicion = nuevaPosicion;
    this.nunca_ha_movido = false;
  }

  /**
   * Marca la pieza como eliminada
   */
  eliminar(): void {
    this.eliminada = true;
  }

  /**
   * Promociona un peón a otra pieza
   */
  promocionar(nuevoTipo: TipoPieza): void {
    if (this.tipo !== 'Peon') {
      throw new Error('Solo los peones pueden ser promocionados');
    }
    this.tipo = nuevoTipo;
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      tipo: this.tipo,
      color: this.color,
      posicion: this.posicion,
      eliminada: this.eliminada,
      nunca_ha_movido: this.nunca_ha_movido,
    };
  }

  /**
   * Crea una instancia desde un DTO
   */
  static createFromDTO(dto: {
    id?: ID;
    tipo?: TipoPieza;
    color?: Color;
    posicion?: Posicion;
    eliminada?: boolean;
  }): Pieza {
    if (!dto.id || !dto.tipo || !dto.color || !dto.posicion) {
      throw new Error('DTO incompleto para crear Pieza');
    }
    return new Pieza({
      id: dto.id,
      tipo: dto.tipo,
      color: dto.color,
      posicion: dto.posicion,
      eliminada: dto.eliminada,
    });
  }
}
