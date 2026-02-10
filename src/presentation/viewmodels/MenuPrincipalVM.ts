/**
 * src/presentation/viewmodels/MenuPrincipalVM.ts
 * ViewModel para la pantalla del menú principal
 * (separación de campos para crear/unirse a sala)
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { ConnectionState } from '../../core/types';
import { Partida } from '../../domain/entities/Partida';
import { Sala } from '../../domain/entities/Sala';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
// ← FIX: importar setPendingPartida para resolver la race condition con PartidaScreen
import { setPendingPartida } from '../../core/gameState';

export class MenuPrincipalVM {
  // Identificación
  nombreJugador: string = '';

  // Campos separados para evitar que escribir en uno afecte al otro
  nombreSalaCrear: string = '';
  nombreSalaUnirse: string = '';

  // (opcional) campo histórico/compatibilidad
  nombreSala: string = '';

  // UI / estado
  error: string | null = null;
  isLoading: boolean = false;
  connectionState: ConnectionState = 'Disconnected';
  salaCreada: Sala | null = null;
  esperandoOponente: boolean = false;
  partida: Partida | null = null;

  private ajedrezUseCase: IAjedrezUseCase;

  constructor(useCase: IAjedrezUseCase) {
    this.ajedrezUseCase = useCase;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Setters
  setNombreJugador(nombre: string): void {
    this.nombreJugador = nombre;
  }

  setNombreSalaCrear(nombre: string): void {
    this.nombreSalaCrear = nombre;
    this.nombreSala = nombre;
  }

  setNombreSalaUnirse(nombre: string): void {
    this.nombreSalaUnirse = nombre;
    this.nombreSala = nombre;
  }

  // Conexión
  async conectar(url: string): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      if (!this.nombreJugador || this.nombreJugador.trim().length === 0) {
        throw new Error('Debes ingresar tu nombre de jugador');
      }

      await this.ajedrezUseCase.conectarJugador(url, this.nombreJugador);

      runInAction(() => {
        this.connectionState = 'Connected';
      });

      // Suscripciones
      this.ajedrezUseCase.subscribeSalaCreada(this.handleSalaCreada.bind(this));
      this.ajedrezUseCase.subscribeJugadorUnido(this.handleJugadorUnido.bind(this));
      this.ajedrezUseCase.subscribePartidaIniciada(this.handleJugadorUnido.bind(this));
      this.ajedrezUseCase.subscribeError(this.handleError.bind(this));
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? 'Error al conectar';
        this.connectionState = 'Disconnected';
      });
      console.error('Error en conectar:', error);
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async desconectar(): Promise<void> {
    try {
      runInAction(() => { this.isLoading = true; });
      await this.ajedrezUseCase.desconectarJugador();
      runInAction(() => {
        this.connectionState = 'Disconnected';
      });
      this.ajedrezUseCase.unsubscribeAll();
    } catch (error: any) {
      console.error('Error al desconectar:', error);
      throw error;
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  }

  // Crear sala (usa nombreSalaCrear)
  async crearSala(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      if (!this.nombreSalaCrear || this.nombreSalaCrear.trim().length === 0) {
        throw new Error('El nombre de la sala no puede estar vacío');
      }

      await this.ajedrezUseCase.crearNuevaSala(this.nombreSalaCrear);

      runInAction(() => {
        this.esperandoOponente = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? 'Error al crear sala';
      });
      console.error('Error en crearSala:', error);
      throw error;
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  }

  // Unirse a sala (usa nombreSalaUnirse)
  async unirseSala(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      if (!this.nombreSalaUnirse || this.nombreSalaUnirse.trim().length === 0) {
        throw new Error('El nombre de la sala no puede estar vacío');
      }

      if (!this.nombreJugador || this.nombreJugador.trim().length === 0) {
        throw new Error('Debes ingresar tu nombre de jugador antes de unirte a una sala');
      }

      await this.ajedrezUseCase.unirseASala(this.nombreSalaUnirse, this.nombreJugador);

      runInAction(() => {
        this.esperandoOponente = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? 'Error al unirse a sala';
      });
      console.error('Error en unirseSala:', error);
      throw error;
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  }

  // Handlers de eventos
  handleSalaCreada(sala: Sala): void {
    runInAction(() => {
      this.salaCreada = sala;
    });
  }

  handleJugadorUnido(partida: Partida): void {
    runInAction(() => {
      this.partida = partida;
      this.esperandoOponente = false;
    });

    // ← FIX RACE CONDITION: guardamos la partida ANTES de navegar a PartidaScreen.
    // Cuando PartidaScreen monte, usePartida() leerá getPendingPartida() e inicializará
    // el VM inmediatamente, sin necesitar esperar a un nuevo evento PartidaIniciada.
    setPendingPartida(partida, this.nombreJugador);
    console.log('[MenuPrincipalVM] Partida guardada como pendiente para PartidaScreen, jugador:', this.nombreJugador);
  }

  handleError(error: string): void {
    runInAction(() => {
      this.error = error;
    });
  }

  reset(): void {
    runInAction(() => {
      this.nombreJugador = '';
      this.nombreSalaCrear = '';
      this.nombreSalaUnirse = '';
      this.nombreSala = '';
      this.error = null;
      this.isLoading = false;
      this.connectionState = 'Disconnected';
      this.salaCreada = null;
      this.esperandoOponente = false;
      this.partida = null;
    });
  }
}

export default MenuPrincipalVM;