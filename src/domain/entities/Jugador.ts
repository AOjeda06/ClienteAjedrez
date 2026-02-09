/**
 * Entidad Jugador
 * Representa un jugador en el sistema de ajedrez
 */

import { ID, Color } from '../types';

export class Jugador {
  id: ID;
  nombre: string;
  color: Color | null;

  constructor(id: ID, nombre: string, color: Color | null = null) {
    this.id = id;
    this.nombre = nombre;
    this.color = color;
  }

  /**
   * Asigna un color al jugador
   */
  asignarColor(color: Color): void {
    this.color = color;
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      nombre: this.nombre,
      color: this.color,
    };
  }
}
