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

  /**
   * Crea una instancia de Jugador a partir de un DTO.
   * Acepta tanto camelCase como PascalCase y valida campos obligatorios.
   */
  static createFromDTO(dto: any): Jugador {
    if (!dto) {
      throw new Error('DTO de Jugador vacío');
    }

    // Aceptar tanto PascalCase como camelCase
    const id = dto.id ?? dto.Id ?? dto.ID ?? null;
    const nombre = dto.nombre ?? dto.Nombre ?? null;
    const color = dto.color ?? dto.Color ?? null;

    if (!id || !nombre) {
      throw new Error('DTO incompleto para crear Jugador');
    }

    return new Jugador(String(id), String(nombre), color ?? null);
  }
}
