/**
 * Implementación de casos de uso de ajedrez
 * Delegación al repositorio con validaciones adicionales
 */

import { IAjedrezRepository } from '../repositories/IAjedrezRepository';
import { IAjedrezUseCase } from '../interfaces/IAjedrezUseCase';
import { Movimiento } from '../entities/Movimiento';
import { Tablero } from '../entities/Tablero';
import { Sala } from '../entities/Sala';
import { Partida } from '../entities/Partida';
import { Color, ResultadoPartida, TipoFinPartida, TipoPieza } from '../types';

export class AjedrezUseCase implements IAjedrezUseCase {
  private ajedrezRepository: IAjedrezRepository;

  constructor(repository: IAjedrezRepository) {
    this.ajedrezRepository = repository;
  }

  async conectarJugador(url: string, nombre: string): Promise<void> {
    return this.ajedrezRepository.connect(url, nombre);
  }

  async desconectarJugador(): Promise<void> {
    return this.ajedrezRepository.disconnect();
  }

  async crearNuevaSala(nombreSala: string): Promise<void> {
    if (!nombreSala || nombreSala.trim().length === 0) {
      throw new Error('El nombre de la sala no puede estar vacío');
    }
    return this.ajedrezRepository.crearSala(nombreSala);
  }

  async unirseASala(nombreSala: string): Promise<void> {
    if (!nombreSala || nombreSala.trim().length === 0) {
      throw new Error('El nombre de la sala no puede estar vacío');
    }
    return this.ajedrezRepository.unirseSala(nombreSala);
  }

  async salirDeSala(): Promise<void> {
    return this.ajedrezRepository.abandonarSala();
  }

  async moverPieza(movimiento: Movimiento): Promise<void> {
    if (!movimiento || !movimiento.id) {
      throw new Error('Movimiento inválido');
    }
    return this.ajedrezRepository.realizarMovimiento(movimiento);
  }

  async confirmarJugada(): Promise<void> {
    return this.ajedrezRepository.confirmarMovimiento();
  }

  async deshacerJugada(): Promise<void> {
    return this.ajedrezRepository.deshacerMovimiento();
  }

  async pedirTablas(): Promise<void> {
    return this.ajedrezRepository.solicitarTablas();
  }

  async cancelarTablas(): Promise<void> {
    return this.ajedrezRepository.retirarTablas();
  }

  async rendirsePartida(): Promise<void> {
    return this.ajedrezRepository.rendirse();
  }

  async seleccionarPromocion(tipo: TipoPieza): Promise<void> {
    if (!['Torre', 'Caballo', 'Alfil', 'Reina'].includes(tipo)) {
      throw new Error(`Tipo de pieza inválido para promoción: ${tipo}`);
    }
    return this.ajedrezRepository.promocionarPeon(tipo);
  }

  async pedirReinicio(): Promise<void> {
    return this.ajedrezRepository.solicitarReinicio();
  }

  async cancelarReinicio(): Promise<void> {
    return this.ajedrezRepository.retirarReinicio();
  }

  subscribeSalaCreada(callback: (sala: Sala) => void): void {
    this.ajedrezRepository.onSalaCreada(callback);
  }

  subscribeJugadorUnido(callback: (partida: Partida) => void): void {
    this.ajedrezRepository.onJugadorUnido(callback);
  }

  subscribePartidaIniciada(callback: (partida: Partida) => void): void {
    this.ajedrezRepository.onPartidaIniciada(callback);
  }

  subscribeMovimiento(callback: (movimiento: Movimiento, tablero: Tablero) => void): void {
    this.ajedrezRepository.onMovimientoRealizado(callback);
  }

  subscribeTurno(callback: (turno: Color, numeroTurno: number) => void): void {
    this.ajedrezRepository.onTurnoActualizado(callback);
  }

  subscribeTablas(callback: (blancas: boolean, negras: boolean) => void): void {
    this.ajedrezRepository.onTablasActualizadas(callback);
  }

  subscribeFinPartida(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void {
    this.ajedrezRepository.onPartidaFinalizada(callback);
  }

  subscribeJaque(callback: (hayJaque: boolean) => void): void {
    this.ajedrezRepository.onJaqueActualizado(callback);
  }

  subscribePromocion(callback: () => void): void {
    this.ajedrezRepository.onPromocionRequerida(callback);
  }

  subscribeReinicio(callback: (blancas: boolean, negras: boolean) => void): void {
    this.ajedrezRepository.onReinicioActualizado(callback);
  }

  subscribeAbandono(callback: (nombreJugador: string) => void): void {
    this.ajedrezRepository.onJugadorAbandonado(callback);
  }

  subscribeError(callback: (error: string) => void): void {
    this.ajedrezRepository.onError(callback);
  }

  unsubscribeAll(): void {
    this.ajedrezRepository.offAllListeners();
  }
}
