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
   * Acepta DTOs con camelCase o PascalCase y usa Jugador.createFromDTO para robustez.
   */
  static createFromDTO(dto: {
    id?: ID;
    Id?: ID;
    nombre?: string;
    Nombre?: string;
    creador?: any;
    Creador?: any;
    oponente?: any | null;
    Oponente?: any | null;
    estado?: EstadoPartida;
    Estado?: EstadoPartida;
  }): Sala {
    if (!dto) {
      throw new Error('DTO incompleto para crear Sala');
    }

    // Aceptar tanto PascalCase como camelCase
    const id = dto.id ?? dto.Id ?? null;
    const nombre = dto.nombre ?? dto.Nombre ?? null;
    const estado = dto.estado ?? dto.Estado ?? null;
    const creadorDto = dto.creador ?? dto.Creador ?? null;
    const oponenteDto = dto.oponente ?? dto.Oponente ?? null;

    if (!id || !nombre || !creadorDto) {
      throw new Error('DTO incompleto para crear Sala');
    }

    // Usar Jugador.createFromDTO para robustez y consistencia
    const creador = creadorDto instanceof Jugador
      ? creadorDto
      : Jugador.createFromDTO(creadorDto);

    const oponente = oponenteDto
      ? (oponenteDto instanceof Jugador ? oponenteDto : Jugador.createFromDTO(oponenteDto))
      : null;

    return new Sala({
      id: String(id),
      nombre: String(nombre),
      creador,
      oponente,
      estado: (estado as EstadoPartida) ?? 'Esperando',
    });
  }
}
