/**
 * ViewModel para la pantalla del menú principal
 * Gestiona la creación/unión a salas y conexión
 */

import { makeAutoObservable } from 'mobx';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { ConnectionState } from '../../core/types';
import { Sala } from '../../domain/entities/Sala';
import { Partida } from '../../domain/entities/Partida';

export class MenuPrincipalVM {
  nombreJugador: string = '';
  nombreSala: string = '';
  error: string | null = null;
  isLoading: boolean = false;
  connectionState: ConnectionState = 'Disconnected';
  salaCreada: Sala | null = null;
  esperandoOponente: boolean = false;
  partida: Partida | null = null;

  private ajedrezUseCase: IAjedrezUseCase;

  constructor(useCase: IAjedrezUseCase) {
    this.ajedrezUseCase = useCase;
    makeAutoObservable(this);
  }

  setNombreJugador(nombre: string): void {
    this.nombreJugador = nombre;
  }

  setNombreSala(nombre: string): void {
    this.nombreSala = nombre;
  }

  async conectar(url: string): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      if (!this.nombreJugador || this.nombreJugador.trim().length === 0) {
        throw new Error('Debes ingresar tu nombre de jugador');
      }

      await this.ajedrezUseCase.conectarJugador(url, this.nombreJugador);
      this.connectionState = 'Connected';

      // Suscribirse a eventos
      this.ajedrezUseCase.subscribeSalaCreada(this.handleSalaCreada.bind(this));
      this.ajedrezUseCase.subscribeJugadorUnido(this.handleJugadorUnido.bind(this));
      this.ajedrezUseCase.subscribeError(this.handleError.bind(this));
    } catch (error: any) {
      this.error = error.message || 'Error al conectar';
      this.connectionState = 'Disconnected';
      console.error('Error en conectar:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async desconectar(): Promise<void> {
    try {
      this.isLoading = true;
      await this.ajedrezUseCase.desconectarJugador();
      this.connectionState = 'Disconnected';
      this.ajedrezUseCase.unsubscribeAll();
    } catch (error: any) {
      console.error('Error al desconectar:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async crearSala(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      if (!this.nombreSala || this.nombreSala.trim().length === 0) {
        throw new Error('El nombre de la sala no puede estar vacío');
      }

      await this.ajedrezUseCase.crearNuevaSala(this.nombreSala);
      this.esperandoOponente = true;
    } catch (error: any) {
      this.error = error.message || 'Error al crear sala';
      console.error('Error en crearSala:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async unirseSala(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      if (!this.nombreSala || this.nombreSala.trim().length === 0) {
        throw new Error('El nombre de la sala no puede estar vacío');
      }

      await this.ajedrezUseCase.unirseASala(this.nombreSala);
      this.esperandoOponente = true;
    } catch (error: any) {
      this.error = error.message || 'Error al unirse a sala';
      console.error('Error en unirseSala:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleSalaCreada(sala: Sala): void {
    this.salaCreada = sala;
  }

  handleJugadorUnido(partida: Partida): void {
    this.partida = partida;
    this.esperandoOponente = false;
  }

  handleError(error: string): void {
    this.error = error;
  }

  reset(): void {
    this.nombreJugador = '';
    this.nombreSala = '';
    this.error = null;
    this.isLoading = false;
    this.connectionState = 'Disconnected';
    this.salaCreada = null;
    this.esperandoOponente = false;
    this.partida = null;
  }
}
