// src/domain/interfaces/IAjedrezUseCase.ts
import { Movimiento } from '../entities/Movimiento';
import { Tablero } from '../entities/Tablero';
import { Sala } from '../entities/Sala';
import { Partida } from '../entities/Partida';
import { Color, ResultadoPartida, TipoFinPartida, TipoPieza } from '../types';

export interface IAjedrezUseCase {
  // Conexión y salas
  conectarJugador(url: string, nombre: string): Promise<void>;
  desconectarJugador(): Promise<void>;
  crearNuevaSala(nombreSala: string): Promise<void>;
  unirseASala(nombreSala: string, nombreJugador: string): Promise<void>;
  salirDeSala(): Promise<void>;

  // Movimientos
  moverPieza(movimiento: Movimiento): Promise<void>;
  confirmarJugada(): Promise<void>;
  deshacerJugada(): Promise<void>;

  // Tablas / Rendición / Promoción / Reinicio
  pedirTablas(): Promise<void>;
  cancelarTablas(): Promise<void>;
  rendirsePartida(): Promise<void>;
  seleccionarPromocion(tipo: TipoPieza): Promise<void>;
  pedirReinicio(): Promise<void>;
  cancelarReinicio(): Promise<void>;

  // Suscripciones (UI)
  subscribeSalaCreada(callback: (sala: Sala) => void): void;
  subscribeJugadorUnido(callback: (partida: Partida) => void): void;
  subscribePartidaIniciada(callback: (partida: Partida) => void): void;
  subscribeMovimiento(callback: (movimiento: Movimiento, tablero: Tablero) => void): void;
  subscribeTableroActualizado(callback: (tablero: Tablero) => void): void;
  subscribeTurno(callback: (turno: Color, numeroTurno: number) => void): void;
  subscribeTablas(callback: (blancas: boolean, negras: boolean) => void): void;
  subscribeFinPartida(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void;
  subscribeJaque(callback: (hayJaque: boolean) => void): void;
  subscribePromocion(callback: () => void): void;
  subscribeReinicio(callback: (blancas: boolean, negras: boolean) => void): void;
  subscribeAbandono(callback: (nombreJugador: string) => void): void;
  subscribeError(callback: (error: string) => void): void;

  // Unsubscribe / cleanup
  unsubscribeAll(): void;
}
