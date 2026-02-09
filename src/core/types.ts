/**
 * Tipos globales para la aplicación de ajedrez
 * Define enumeraciones y tipos utilizados en toda la aplicación
 */

// Tipos básicos
export type ID = string;
export type ConnectionState = 'Connected' | 'Disconnected' | 'Connecting' | 'Reconnecting';
export type Color = 'Blanca' | 'Negra';
export type TipoPieza = 'Peon' | 'Torre' | 'Caballo' | 'Alfil' | 'Reina' | 'Rey';
export type EstadoPartida = 'Esperando' | 'EnCurso' | 'Finalizada';
export type ResultadoPartida = 'Victoria' | 'Derrota' | 'Empate' | null;
export type TipoFinPartida = 'JaqueMate' | 'Tablas' | 'Rendicion' | 'Abandono';

// Interfaces de dominio
export interface Posicion {
  fila: number;
  columna: number;
}

export interface MovimientoDTO {
  id?: ID;
  piezaId?: ID;
  origen?: { fila?: number; columna?: number };
  destino?: { fila?: number; columna?: number };
  piezaCapturada?: ID | null;
  esEnroque?: boolean;
  esPromocion?: boolean;
  confirmado?: boolean;
}

export interface PiezaDTO {
  id?: ID;
  tipo?: TipoPieza;
  color?: Color;
  posicion?: { fila?: number; columna?: number };
  eliminada?: boolean;
}

export interface TableroDTO {
  piezas?: PiezaDTO[];
  movimientos?: MovimientoDTO[];
}

export interface SalaDTO {
  id?: ID;
  nombre?: string;
  creador?: JugadorDTO;
  oponente?: JugadorDTO | null;
  estado?: EstadoPartida;
}

export interface PartidaDTO {
  id?: ID;
  salaId?: ID;
  tablero?: TableroDTO;
  jugadorBlancas?: JugadorDTO;
  jugadorNegras?: JugadorDTO;
  turnoActual?: Color;
  numeroTurnos?: number;
  tiempoTranscurrido?: number;
  estado?: EstadoPartida;
  resultado?: ResultadoPartida;
  tipoFin?: TipoFinPartida | null;
  tablasBlancas?: boolean;
  tablasNegras?: boolean;
  hayJaque?: boolean;
  hayJaqueMate?: boolean;
}

export interface JugadorDTO {
  id?: ID;
  nombre?: string;
  color?: Color;
}

// Constantes de tablero
export const TABLERO_FILAS = 8;
export const TABLERO_COLUMNAS = 8;

// Validaciones
export const esPosicionValida = (posicion: Posicion): boolean => {
  return posicion.fila >= 0 && posicion.fila < TABLERO_FILAS &&
         posicion.columna >= 0 && posicion.columna < TABLERO_COLUMNAS;
};

export const posicionesIguales = (pos1: Posicion, pos2: Posicion): boolean => {
  return pos1.fila === pos2.fila && pos1.columna === pos2.columna;
};

export const posicionAString = (posicion: Posicion): string => {
  const columna = String.fromCharCode(97 + posicion.columna);
  const fila = 8 - posicion.fila;
  return `${columna}${fila}`;
};

export const stringAPosicion = (notacion: string): Posicion | null => {
  if (notacion.length !== 2) return null;
  const columna = notacion.charCodeAt(0) - 97;
  const fila = 8 - parseInt(notacion[1], 10);
  if (columna < 0 || columna >= TABLERO_COLUMNAS || fila < 0 || fila >= TABLERO_FILAS) {
    return null;
  }
  return { fila, columna };
};
