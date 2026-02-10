/**
 * src/domain/usecases/AjedrezUseCase.ts
 * Casos de uso de ajedrez (validaciones + delegación) con manejo de suscriptores y cache de última partida
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

  private partidaIniciadaCallbacks: Array<(partida: Partida) => void> = [];
  private lastPartida: Partida | null = null;

  constructor(repository: IAjedrezRepository) {
    this.ajedrezRepository = repository;

    try {
      this.ajedrezRepository.onPartidaIniciada((p: Partida) => this.handlePartidaIniciadaFromRepo(p));
      console.log('[TRACE usecase] Suscripción interna a onPartidaIniciada registrada en constructor');
    } catch (err) {
      console.warn('[WARN usecase] No se pudo registrar suscripción interna a onPartidaIniciada:', err);
    }
  }

  private handlePartidaIniciadaFromRepo(partida: Partida): void {
    console.log('[TRACE usecase] evento PartidaIniciada recibido en usecase (distribuyendo):', { id: partida.id, salaId: partida.salaId });
    this.lastPartida = partida;
    for (const cb of this.partidaIniciadaCallbacks) {
      try {
        cb(partida);
      } catch (err) {
        console.error('[ERROR usecase] callback PartidaIniciada falló:', err);
      }
    }
  }

  async conectarJugador(url: string, nombre: string): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Debes proporcionar un nombre de jugador para conectar');
    }
    console.log('[TRACE usecase] conectarJugador ->', nombre, url);
    return this.ajedrezRepository.connect(url, nombre);
  }

  async desconectarJugador(): Promise<void> {
    console.log('[TRACE usecase] desconectarJugador');
    return this.ajedrezRepository.disconnect();
  }

  async crearNuevaSala(nombreSala: string): Promise<void> {
    if (!nombreSala || nombreSala.trim().length === 0) {
      throw new Error('El nombre de la sala no puede estar vacío');
    }
    console.log('[TRACE usecase] crearNuevaSala ->', nombreSala);
    return this.ajedrezRepository.crearSala(nombreSala);
  }

  async unirseASala(nombreSala: string, nombreJugador: string): Promise<void> {
    if (!nombreSala || nombreSala.trim().length === 0) {
      throw new Error('El nombre de la sala no puede estar vacío');
    }
    if (!nombreJugador || nombreJugador.trim().length === 0) {
      throw new Error('Debes ingresar tu nombre de jugador antes de unirte a una sala');
    }
    console.log('[TRACE usecase] unirseASala -> sala:', nombreSala, 'jugador:', nombreJugador);
    try {
      await this.ajedrezRepository.unirseSala(nombreSala, nombreJugador);
    } catch (err) {
      console.error('[ERROR usecase] unirseASala falló:', err);
      throw err;
    }
  }

  async salirDeSala(): Promise<void> {
    console.log('[TRACE usecase] salirDeSala');
    return this.ajedrezRepository.abandonarSala();
  }

  async moverPieza(movimiento: Movimiento): Promise<void> {
    if (!movimiento || !movimiento.id) {
      throw new Error('Movimiento inválido');
    }
    console.log('[TRACE usecase] moverPieza ->', movimiento.id);
    return this.ajedrezRepository.realizarMovimiento(movimiento);
  }

  async confirmarJugada(): Promise<void> {
    console.log('[TRACE usecase] confirmarJugada');
    return this.ajedrezRepository.confirmarMovimiento();
  }

  async deshacerJugada(): Promise<void> {
    console.log('[TRACE usecase] deshacerJugada');
    return this.ajedrezRepository.deshacerMovimiento();
  }

  async pedirTablas(): Promise<void> {
    console.log('[TRACE usecase] pedirTablas');
    return this.ajedrezRepository.solicitarTablas();
  }

  async cancelarTablas(): Promise<void> {
    console.log('[TRACE usecase] cancelarTablas');
    return this.ajedrezRepository.retirarTablas();
  }

  async rendirsePartida(): Promise<void> {
    console.log('[TRACE usecase] rendirsePartida');
    return this.ajedrezRepository.rendirse();
  }

  async seleccionarPromocion(tipo: TipoPieza): Promise<void> {
    if (!['Torre', 'Caballo', 'Alfil', 'Reina'].includes(tipo)) {
      throw new Error(`Tipo de pieza inválido para promoción: ${tipo}`);
    }
    console.log('[TRACE usecase] seleccionarPromocion ->', tipo);
    return this.ajedrezRepository.promocionarPeon(tipo);
  }

  async pedirReinicio(): Promise<void> {
    console.log('[TRACE usecase] pedirReinicio');
    return this.ajedrezRepository.solicitarReinicio();
  }

  async cancelarReinicio(): Promise<void> {
    console.log('[TRACE usecase] cancelarReinicio');
    return this.ajedrezRepository.retirarReinicio();
  }

  subscribeSalaCreada(callback: (sala: Sala) => void): void {
    console.log('[TRACE usecase] subscribeSalaCreada registrado');
    this.ajedrezRepository.onSalaCreada((sala) => {
      console.log('[TRACE usecase] evento SalaCreada recibido en usecase:', { id: sala.id, nombre: sala.nombre });
      callback(sala);
    });
  }

  subscribeJugadorUnido(callback: (partida: Partida) => void): void {
    console.log('[TRACE usecase] subscribeJugadorUnido registrado');
    this.ajedrezRepository.onJugadorUnido((partida) => {
      console.log('[TRACE usecase] evento JugadorUnido recibido en usecase:', { id: partida.id, salaId: partida.salaId });
      callback(partida);
    });
  }

  subscribePartidaIniciada(callback: (partida: Partida) => void): void {
    console.log('[TRACE usecase] subscribePartidaIniciada registrado (UI)');
    this.partidaIniciadaCallbacks.push(callback);
    if (this.lastPartida) {
      try {
        console.log('[TRACE usecase] entregando lastPartida inmediatamente al nuevo suscriptor:', { id: this.lastPartida.id });
        callback(this.lastPartida);
      } catch (err) {
        console.error('[ERROR usecase] callback inicial (lastPartida) falló:', err);
      }
    }
  }

  subscribeMovimiento(callback: (movimiento: Movimiento, tablero: Tablero) => void): void {
    console.log('[TRACE usecase] subscribeMovimiento registrado');
    this.ajedrezRepository.onMovimientoRealizado((movimiento, tablero) => {
      callback(movimiento, tablero);
    });
  }

  subscribeTurno(callback: (turno: Color, numeroTurno: number) => void): void {
    console.log('[TRACE usecase] subscribeTurno registrado');
    this.ajedrezRepository.onTurnoActualizado((turno, numeroTurno) => {
      callback(turno, numeroTurno);
    });
  }

  subscribeTablas(callback: (blancas: boolean, negras: boolean) => void): void {
    console.log('[TRACE usecase] subscribeTablas registrado');
    this.ajedrezRepository.onTablasActualizadas((blancas, negras) => {
      callback(blancas, negras);
    });
  }

  subscribeFinPartida(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void {
    console.log('[TRACE usecase] subscribeFinPartida registrado');
    this.ajedrezRepository.onPartidaFinalizada((resultado, tipo, ganador) => {
      callback(resultado, tipo, ganador);
    });
  }

  subscribeJaque(callback: (hayJaque: boolean) => void): void {
    console.log('[TRACE usecase] subscribeJaque registrado');
    this.ajedrezRepository.onJaqueActualizado((hayJaque) => {
      callback(hayJaque);
    });
  }

  subscribePromocion(callback: () => void): void {
    console.log('[TRACE usecase] subscribePromocion registrado');
    this.ajedrezRepository.onPromocionRequerida(() => {
      callback();
    });
  }

  subscribeReinicio(callback: (blancas: boolean, negras: boolean) => void): void {
    console.log('[TRACE usecase] subscribeReinicio registrado');
    this.ajedrezRepository.onReinicioActualizado((blancas, negras) => {
      callback(blancas, negras);
    });
  }

  subscribeAbandono(callback: (nombreJugador: string) => void): void {
    console.log('[TRACE usecase] subscribeAbandono registrado');
    this.ajedrezRepository.onJugadorAbandonado((nombreJugador) => {
      callback(nombreJugador);
    });
  }

  subscribeError(callback: (error: string) => void): void {
    console.log('[TRACE usecase] subscribeError registrado');
    this.ajedrezRepository.onError((error) => {
      callback(error);
    });
  }

  unsubscribeAll(): void {
    console.log('[TRACE usecase] unsubscribeAll -> delegando a repo.offAllListeners y limpiando callbacks');
    this.ajedrezRepository.offAllListeners();
    this.partidaIniciadaCallbacks = [];
  }
}
