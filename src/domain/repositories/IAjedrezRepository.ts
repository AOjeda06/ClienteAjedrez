/**
 * Interfaz del repositorio de ajedrez
 * Define el contrato para acceso a datos
 */

import { Movimiento } from '../entities/Movimiento';
import { Tablero } from '../entities/Tablero';
import { Sala } from '../entities/Sala';
import { Partida } from '../entities/Partida';
import { Color, ConnectionState, ResultadoPartida, TipoFinPartida, TipoPieza, ID } from '../types';

export interface IAjedrezRepository {
  // Conexión
  connect(url: string, jugadorNombre: string): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ConnectionState;

  // Operaciones de sala
  crearSala(nombreSala: string): Promise<void>;
  unirseSala(nombreSala: string): Promise<void>;
  abandonarSala(): Promise<void>;

  // Operaciones de movimiento
  realizarMovimiento(movimiento: Movimiento): Promise<void>;
  confirmarMovimiento(): Promise<void>;
  deshacerMovimiento(): Promise<void>;

  // Operaciones de tablas
  solicitarTablas(): Promise<void>;
  retirarTablas(): Promise<void>;

  // Operaciones de rendición
  rendirse(): Promise<void>;

  // Operaciones de promoción
  promocionarPeon(tipoPieza: TipoPieza): Promise<void>;

  // Operaciones de reinicio
  solicitarReinicio(): Promise<void>;
  retirarReinicio(): Promise<void>;

  // Listeners para eventos del servidor
  onSalaCreada(callback: (sala: Sala) => void): void;
  onJugadorUnido(callback: (partida: Partida) => void): void;
  onPartidaIniciada(callback: (partida: Partida) => void): void;
  onMovimientoRealizado(callback: (movimiento: Movimiento, tablero: Tablero) => void): void;
  onTurnoActualizado(callback: (turno: Color, numeroTurno: number) => void): void;
  onTablasActualizadas(callback: (blancas: boolean, negras: boolean) => void): void;
  onPartidaFinalizada(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void;
  onJaqueActualizado(callback: (hayJaque: boolean) => void): void;
  onPromocionRequerida(callback: () => void): void;
  onReinicioActualizado(callback: (blancas: boolean, negras: boolean) => void): void;
  onJugadorAbandonado(callback: (nombreJugador: string) => void): void;
  onError(callback: (error: string) => void): void;
  offAllListeners(): void;
}
