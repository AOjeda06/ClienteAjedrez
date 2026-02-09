/**
 * Entidad Sala
 * Representa una sala de juego donde se reúnen dos jugadores
 */

import { ID, EstadoPartida } from '../types';
import { Jugador } from './Jugador';

export interface SalaProps {
  id: ID;
  nombre: string;
  creador: Jugador;
  oponente?: Jugador | null;
  estado?: EstadoPartida;
}

export class Sala {
  id: ID;
  nombre: string;
  creador: Jugador;
  oponente: Jugador | null;
  estado: EstadoPartida;

  constructor(props: SalaProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.creador = props.creador;
    this.oponente = props.oponente ?? null;
    this.estado = props.estado ?? 'Esperando';
  }

  /**
   * Agrega un oponente a la sala
   */
  agregarOponente(jugador: Jugador): void {
    this.oponente = jugador;
  }

  /**
   * Inicia la partida en la sala
   */
  iniciarPartida(): void {
    if (this.oponente) {
      this.estado = 'EnCurso';
    }
  }

  /**
   * Finaliza la partida en la sala
   */
  finalizarPartida(): void {
    this.estado = 'Finalizada';
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      nombre: this.nombre,
      creador: this.creador.toPlain(),
      oponente: this.oponente?.toPlain() ?? null,
      estado: this.estado,
    };
  }

  /**
   * Crea una instancia desde un DTO
   */
  static createFromDTO(dto: {
    id?: ID;
    nombre?: string;
    creador?: any;
    oponente?: any | null;
    estado?: EstadoPartida;
  }): Sala {
    if (!dto.id || !dto.nombre || !dto.creador) {
      throw new Error('DTO incompleto para crear Sala');
    }

    const creador = dto.creador instanceof Jugador
      ? dto.creador
      : new Jugador(dto.creador.id, dto.creador.nombre, dto.creador.color);

    const oponente = dto.oponente
      ? dto.oponente instanceof Jugador
        ? dto.oponente
        : new Jugador(dto.oponente.id, dto.oponente.nombre, dto.oponente.color)
      : null;

    return new Sala({
      id: dto.id,
      nombre: dto.nombre,
      creador,
      oponente,
      estado: dto.estado,
    });
  }
}
