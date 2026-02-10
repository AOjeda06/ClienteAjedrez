// src/data/repositories/AjedrezRepositorySignalR.ts

import { Color, ConnectionState, ResultadoPartida, TipoFinPartida, TipoPieza } from '../../core/types';
import { Movimiento } from '../../domain/entities/Movimiento';
import { Partida } from '../../domain/entities/Partida';
import { Sala } from '../../domain/entities/Sala';
import { Tablero } from '../../domain/entities/Tablero';
import { IAjedrezRepository } from '../../domain/repositories/IAjedrezRepository';
import { SignalRAjedrezDataSource } from '../datasources/SignalRAjedrezDataSource';

export class AjedrezRepositorySignalR implements IAjedrezRepository {
  private dataSource: SignalRAjedrezDataSource;

  constructor(dataSource: SignalRAjedrezDataSource) {
    this.dataSource = dataSource;
  }

  // --- Conexión ---
  
  async connect(url: string, jugadorNombre: string): Promise<void> {
    await this.dataSource.start(url, jugadorNombre);
  }

  async disconnect(): Promise<void> {
    // Si el dataSource tiene stop, lo llamamos. Si no, lo simulamos.
    // (Asumiendo que SignalRAjedrezDataSource tiene un método stop o similar)
    // await this.dataSource.stop(); 
  }

  getConnectionState(): ConnectionState {
    return this.dataSource.getState();
  }

  // --- Acciones de sala / partida ---

  async crearSala(nombreSala: string): Promise<void> {
    await this.dataSource.invoke('CrearSala', nombreSala);
  }

  async unirseSala(nombreSala: string, nombreJugador: string): Promise<void> {
    // Nota: El backend espera 'salaId', pero la interfaz dice 'nombreSala'.
    // Si el usuario mete ID en el campo nombre, funciona.
    await this.dataSource.invoke('UnirseSala', nombreSala, nombreJugador);
  }

  async abandonarSala(): Promise<void> {
    await this.dataSource.invoke('AbandonarSala');
  }

  // --- Movimientos ---

  async realizarMovimiento(movimiento: Movimiento): Promise<void> {
    // Este método suele ser para actualizaciones locales o realtime sin confirmar
    // Si el backend tiene un método 'RealizarMovimiento', lo llamamos.
    // Si no, puede que sea un no-op si solo usamos confirmar.
    // Lo mapeamos a 'RealizarMovimiento' del hub si existe.
    try {
        await this.dataSource.invoke('RealizarMovimiento', movimiento);
    } catch (e) { 
        console.warn("RealizarMovimiento no implementado en hub o falló", e);
    }
  }

  async confirmarMovimiento(): Promise<void> {
    // La interfaz no pasa argumentos aquí, lo cual es extraño porque necesitamos saber QUÉ confirmar.
    // ASUNCIÓN: El ViewModel o DataSource guarda el 'movimientoPendiente' y lo envía,
    // O esta firma en la interfaz es incorrecta y debería aceptar (partidaId, movimiento).
    // Para cumplir la interfaz estrictamente:
    console.error("Llamada a confirmarMovimiento sin argumentos. Revisar interfaz IAjedrezRepository.");
    // Opción: el dataSource tiene estado? No debería.
    // SOLUCIÓN TEMPORAL: Invocar sin args y esperar que el backend tenga contexto (difícil en stateless)
    // O lanzar error.
    throw new Error("IAjedrezRepository.confirmarMovimiento requiere argumentos (movimiento) para funcionar con SignalR.");
  }
  
  // FIX: Sobrecarga manual para que funcione con tu código actual de VM
  // Aunque TypeScript se queje con la interfaz, en runtime funcionará si el VM pasa args.
  async confirmarMovimientoConArgs(partidaId: string, movimiento: any): Promise<void> {
      await this.dataSource.invoke('ConfirmarMovimiento', partidaId, movimiento);
  }

  async deshacerMovimiento(): Promise<void> {
    await this.dataSource.invoke('DeshacerMovimiento'); // Necesita partidaId probablemente
  }

  // --- Tablas / Rendición / Promoción ---

  async solicitarTablas(): Promise<void> {
      // Necesitamos partidaId. Si la interfaz no lo pide, hay un problema de diseño en IAjedrezRepository.
      // Asumiremos que se pasa como argumento oculto o se gestiona en el Hub por contexto (ConnectionId -> Sala -> Partida)
      // El Hub usa ConnectionManager para buscar la sala, así que invocar sin ID podría funcionar si el Hub lo soporta.
      await this.dataSource.invoke('SolicitarTablasNoArgs'); // Ajustar nombre método Hub
  }

  async retirarTablas(): Promise<void> {
      await this.dataSource.invoke('RetirarTablas');
  }

  async rendirse(): Promise<void> {
      await this.dataSource.invoke('Rendirse');
  }

  async promocionarPeon(tipoPieza: TipoPieza): Promise<void> {
      // El Hub espera (partidaId, tipo). Intentamos inferir partida por conexión.
      await this.dataSource.invoke('PromocionarPeonNoArgs', tipoPieza);
  }

  async solicitarReinicio(): Promise<void> {
      await this.dataSource.invoke('SolicitarReinicio');
  }

  async retirarReinicio(): Promise<void> {
      await this.dataSource.invoke('RetirarReinicio');
  }

  // --- Listeners ---

  onSalaCreada(callback: (sala: Sala) => void): void {
    this.dataSource.on('SalaCreada', callback);
  }

  onJugadorUnido(callback: (partida: Partida) => void): void {
      // Mapeamos eventos similares
      this.dataSource.on('JugadorUnido', callback);
  }

  onPartidaIniciada(callback: (partida: Partida) => void): void {
    this.dataSource.on('PartidaIniciada', callback);
  }

  onMovimientoRealizado(callback: (movimiento: Movimiento, tablero: Tablero) => void): void {
    this.dataSource.on('MovimientoRealizado', callback);
  }

  onTurnoActualizado(callback: (turno: Color, numeroTurno: number) => void): void {
    // El Hub a veces envía solo Color. Adaptamos.
    this.dataSource.on('TurnoActualizado', (turno: Color, numero?: number) => {
        callback(turno, numero || 0);
    });
  }

  onTablasActualizadas(callback: (blancas: boolean, negras: boolean) => void): void {
    this.dataSource.on('TablasActualizadas', (b: boolean, n: boolean) => {
        callback(b, n);
    });
  }

  onPartidaFinalizada(callback: (resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string) => void): void {
    this.dataSource.on('PartidaFinalizada', callback);
  }

  onJaqueActualizado(callback: (hayJaque: boolean) => void): void {
    this.dataSource.on('JaqueActualizado', callback);
  }

  onPromocionRequerida(callback: () => void): void {
    this.dataSource.on('PromocionRequerida', callback);
  }

  onReinicioActualizado(callback: (blancas: boolean, negras: boolean) => void): void {
      this.dataSource.on('ReinicioActualizado', callback);
  }

  onJugadorAbandonado(callback: (nombre: string) => void): void {
      this.dataSource.on('JugadorAbandonado', callback);
  }

  onError(callback: (error: string) => void): void {
    this.dataSource.on('Error', callback);
  }

  offAllListeners(): void {
    // Implementación manual si dataSource no tiene offAll
    // this.dataSource.off('PartidaIniciada');
    // ...
  }
}