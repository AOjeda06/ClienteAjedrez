// src/domain/repositories/IAjedrezRepository.ts
import { Movimiento } from '../../domain/entities/Movimiento';
import { Tablero } from '../../domain/entities/Tablero';
import { Sala } from '../../domain/entities/Sala';
import { Partida } from '../../domain/entities/Partida';
import { Color, ConnectionState, ResultadoPartida, TipoFinPartida, TipoPieza } from '../../core/types';

export interface IAjedrezRepository {
  // Conexión
  connect(url: string, jugadorNombre: string): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ConnectionState;

  // Acciones de sala / partida
  crearSala(nombreSala: string): Promise<void>;
  unirseSala(nombreSala: string, nombreJugador: string): Promise<void>;
  abandonarSala(): Promise<void>;

  // Movimientos
  realizarMovimiento(movimiento: Movimiento): Promise<void>;
  confirmarMovimiento(): Promise<void>;
  deshacerMovimiento(): Promise<void>;

  // Tablas / Rendición / Promoción / Reinicio
  solicitarTablas(): Promise<void>;
  retirarTablas(): Promise<void>;
  rendirse(): Promise<void>;
  promocionarPeon(tipoPieza: TipoPieza): Promise<void>;
  solicitarReinicio(): Promise<void>;
  retirarReinicio(): Promise<void>;

  // Listeners / eventos entrantes desde SignalR
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

  // Quitar listeners
  offAllListeners(): void;
}
