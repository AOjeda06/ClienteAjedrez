/**
 * ViewModel para la pantalla de identificación
 * Gestiona el nombre del jugador y validaciones
 */

import { makeAutoObservable } from 'mobx';

export class IdentificacionVM {
  nombreJugador: string = '';
  error: string | null = null;
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setNombre(nombre: string): void {
    this.nombreJugador = nombre;
    this.error = null;
  }

  validarYContinuar(): boolean {
    if (!this.nombreJugador || this.nombreJugador.trim().length === 0) {
      this.error = 'El nombre del jugador no puede estar vacío';
      return false;
    }

    if (this.nombreJugador.trim().length < 2) {
      this.error = 'El nombre debe tener al menos 2 caracteres';
      return false;
    }

    if (this.nombreJugador.trim().length > 20) {
      this.error = 'El nombre no puede exceder 20 caracteres';
      return false;
    }

    this.error = null;
    return true;
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  reset(): void {
    this.nombreJugador = '';
    this.error = null;
    this.isLoading = false;
  }
}
