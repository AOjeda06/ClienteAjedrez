/**
 * Implementación del repositorio de ajedrez con SignalR
 */

import { IAjedrezRepository } from '../../domain/repositories/IAjedrezRepository';
import { SignalRAjedrezDataSource } from '../datasources/SignalRAjedrezDataSource';
import { Movimiento } from '../../domain/entities/Movimiento';
import { Tablero } from '../../domain/entities/Tablero';
import { Sala } from '../../domain/entities/Sala';
import { Partida } from '../../domain/entities/Partida';
import { Color, ConnectionState, ResultadoPartida, TipoFinPartida, TipoPieza } from '../../core/types';
import {
  PartidaDomainMapper,
  SalaDomainMapper,
  MovimientoDomainMapper,
  TableroDomainMapper,
} from '../../domain/mappers/DomainMappers';

export class AjedrezRepositorySignalR implements IAjedrezRepository {
  private dataSource: SignalRAjedrezDataSource;
  private currentState: ConnectionState = 'Disconnected';

  constructor(dataSource: SignalRAjedrezDataSource) {
    this.dataSource = dataSource;
  }

  async connect(url: string, jugadorNombre: string): Promise<void> {
    await this.dataSource.start(url, jugadorNombre);
    this.currentState = 'Connected';
  }

  async disconnect(): Promise<void> {
    await this.dataSource.stop();
    this.currentState = 'Disconnected';
  }

  getConnectionState(): ConnectionState {
    return this.dataSource.getState();
  }

  async crearSala(nombreSala: string): Promise<void> {
    await this.dataSource.invoke('CrearSala', nombreSala);
  }

  async unirseSala(nombreSala: string): Promise<void> {
    await this.dataSource.invoke('UnirseSala', nombreSala);
  }

  async abandonarSala(): Promise<void> {
    await this.dataSource.invoke('AbandonarSala');
  }

  async realizarMovimiento(movimiento: Movimiento): Promise<void> {
    await this.dataSource.invoke('RealizarMovimiento', movimiento.toPlain());
  }

  async confirmarMovimiento(): Promise<void> {
    await this.dataSource.invoke('ConfirmarMovimiento');
  }

  async deshacerMovimiento(): Promise<void> {
    await this.dataSource.invoke('DeshacerMovimiento');
  }

  async solicitarTablas(): Promise<void> {
    await this.dataSource.invoke('SolicitarTablas');
  }

  async retirarTablas(): Promise<void> {
    await this.dataSource.invoke('RetirarTablas');
  }

  async rendirse(): Promise<void> {
    await this.dataSource.invoke('Rendirse');
  }

  async promocionarPeon(tipoPieza: TipoPieza): Promise<void> {
    await this.dataSource.invoke('PromocionarPeon', tipoPieza);
  }

  async solicitarReinicio(): Promise<void> {
    await this.dataSource.invoke('SolicitarReinicio');
  }

  async retirarReinicio(): Promise<void> {
    await this.dataSource.invoke('RetirarReinicio');
  }

  onSalaCreada(callback: (sala: Sala) => void): void {
    this.dataSource.on('SalaCreada', (dto: any) => {
      try {
        const sala = SalaDomainMapper.toDomain(dto);
        callback(sala);
      } catch (error) {
        console.error('Error mapeando SalaCreada:', error);
      }
    });
  }

  onJugadorUnido(callback: (partida: Partida) => void): void {
    this.dataSource.on('JugadorUnido', (dto: any) => {
      try {
        const partida = PartidaDomainMapper.toDomain(dto);
        callback(partida);
      } catch (error) {
        console.error('Error mapeando JugadorUnido:', error);
      }
    });
  }

  onPartidaIniciada(callback: (partida: Partida) => void): void {
    this.dataSource.on('PartidaIniciada', (dto: any) => {
      try {
        const partida = PartidaDomainMapper.toDomain(dto);
        callback(partida);
      } catch (error) {
        console.error('Error mapeando PartidaIniciada:', error);
      }
    });
  }

  onMovimientoRealizado(callback: (movimiento: Movimiento, tablero: Tablero) => void): void {
    this.dataSource.on('MovimientoRealizado', (movDTO: any, tableroDTO: any) => {
      try {
        const movimiento = MovimientoDomainMapper.toDomain(movDTO);
        const tablero = TableroDomainMapper.toDomain(tableroDTO);
        callback(movimiento, tablero);
      } catch (error) {
        console.error('Error mapeando MovimientoRealizado:', error);
      }
    });
  }

  onTurnoActualizado(callback: (turno: Color, numeroTurno: number) => void): void {
    this.dataSource.on('TurnoActualizado', (turno: Color, numeroTurno: number) => {
      callback(turno, numeroTurno);
    });
  }

  onTablasActualizadas(callback: (blancas: boolean, negras: boolean) => void): void {
    this.dataSource.on('TablasActualizadas', (blancas: boolean, negras: boolean) => {
      callback(blancas, negras);
    });
  }

  onPartidaFinalizada(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void {
    this.dataSource.on('PartidaFinalizada', (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => {
      callback(resultado, tipo, ganador);
    });
  }

  onJaqueActualizado(callback: (hayJaque: boolean) => void): void {
    this.dataSource.on('JaqueActualizado', (hayJaque: boolean) => {
      callback(hayJaque);
    });
  }

  onPromocionRequerida(callback: () => void): void {
    this.dataSource.on('PromocionRequerida', () => {
      callback();
    });
  }

  onReinicioActualizado(callback: (blancas: boolean, negras: boolean) => void): void {
    this.dataSource.on('ReinicioActualizado', (blancas: boolean, negras: boolean) => {
      callback(blancas, negras);
    });
  }

  onJugadorAbandonado(callback: (nombreJugador: string) => void): void {
    this.dataSource.on('JugadorAbandonado', (nombreJugador: string) => {
      callback(nombreJugador);
    });
  }

  onError(callback: (error: string) => void): void {
    this.dataSource.on('Error', (error: string) => {
      callback(error);
    });
  }

  offAllListeners(): void {
    this.dataSource.offAll();
  }
}
