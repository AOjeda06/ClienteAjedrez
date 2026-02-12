/**
 * ViewModel para la pantalla de partida
 * Gestiona toda la lógica de juego
 */

import { isObservable, makeAutoObservable, runInAction, observable } from 'mobx';
import { Color, Posicion, posicionesIguales, ResultadoPartida, TipoFinPartida, TipoPieza } from '../../core/types';

/** Safely make an object observable (no-op if already observable) */
const safeObservable = (obj: any) => {
  if (obj && !isObservable(obj)) {
    makeAutoObservable(obj);
  }
};
import { Movimiento } from '../../domain/entities/Movimiento';
import { Partida } from '../../domain/entities/Partida';
import { Pieza } from '../../domain/entities/Pieza';
import { Tablero } from '../../domain/entities/Tablero';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';

export class PartidaVM {
  partida: Partida | null = null;
  tablero: Tablero | null = null;
  miColor: Color | null = null;
  miNombre: string = '';
  nombreOponente: string = '';
  piezaSeleccionada: Pieza | null = null;
  movimientosPosibles: Posicion[] = [];
  movimientoPendiente: Movimiento | null = null;
  mostrarPromocion: boolean = false;
  mostrarFinPartida: boolean = false;
  mensajeTurno: string | null = null;
  mensajeJaque: string | null = null;
  piezasEliminadasBlancas = observable.map<TipoPieza, number>();
  piezasEliminadasNegras = observable.map<TipoPieza, number>();
  error: string | null = null;
  tablasOfrecidas: boolean = false;
  solicitadasTablas: boolean = false;
  solicitadoReinicio: boolean = false;
  oponenteSolicitoReinicio: boolean = false;
  oponenteAbandono: boolean = false;

  private ajedrezUseCase: IAjedrezUseCase;
  private proximoMovimientoEsEnroque: boolean = false;
  private timer: number | null = null;

  constructor(useCase: IAjedrezUseCase) {
    this.ajedrezUseCase = useCase;
    makeAutoObservable(this);
  }

  inicializarPartida(partida: Partida, miColor: Color, miNombre: string): void {
    this.partida = partida;
    safeObservable(this.partida);
    safeObservable(partida.tablero);
    this.miColor = miColor;
    this.miNombre = miNombre;
    this.tablero = partida.tablero;

    // Determinar nombre del oponente
    if (miColor === 'Blanca') {
      this.nombreOponente = partida.jugadorNegras.nombre;
    } else {
      this.nombreOponente = partida.jugadorBlancas.nombre;
    }

    // Inicializar contadores de piezas eliminadas
    this.actualizarPiezasEliminadas();
    this.actualizarMensajeTurno();

    // Iniciar timer para incrementar tiempo transcurrido
    this.startTimer();

    // Suscribirse a eventos
    this.ajedrezUseCase.subscribeMovimiento(this.handleMovimiento.bind(this));
    this.ajedrezUseCase.subscribeTableroActualizado(this.handleTableroActualizado.bind(this));
    this.ajedrezUseCase.subscribeTurno(this.handleTurnoActualizado.bind(this));
    this.ajedrezUseCase.subscribeJaque(this.handleJaqueActualizado.bind(this));
    this.ajedrezUseCase.subscribeFinPartida(this.handlePartidaFinalizada.bind(this));
    this.ajedrezUseCase.subscribePromocion(this.handlePromocionRequerida.bind(this));
    this.ajedrezUseCase.subscribeTablas(this.handleTablasActualizadas.bind(this));
    this.ajedrezUseCase.subscribeReinicio(this.handleReinicioActualizado.bind(this));
    this.ajedrezUseCase.subscribeAbandono(this.handleOponenteAbandono.bind(this));
    this.ajedrezUseCase.subscribePartidaIniciada(this.handleReinicioPartida.bind(this));
    this.ajedrezUseCase.subscribeError(this.handleError.bind(this));

    console.log('[PartidaVM] inicializarPartida:', {
      id: partida.id,
      salaId: partida.salaId,
      miColor,
      miNombre,
      turnoActual: partida.turnoActual,
    });
  }

  /**
   * Selecciona una casilla (puede ser pieza o destino de movimiento)
   */
  seleccionarCasilla(posicion: Posicion): void {
    // Trazas para depuración: siempre registrar intento de selección
    console.log('[TRACE PartidaVM] seleccionarCasilla invoked', {
      posicion,
      tableroExists: !!this.tablero,
      miColor: this.miColor,
      turnoActual: this.partida?.turnoActual,
      esMiTurno: this.esMiTurno(),
      movimientoPendiente: !!this.movimientoPendiente,
    });

    // Mensajes de ayuda en UI para depuración
    if (!this.tablero) {
      runInAction(() => { this.error = 'Tablero no inicializado'; });
      console.warn('[PartidaVM] seleccionarCasilla: tablero no inicializado');
      return;
    }
    if (!this.miColor) {
      runInAction(() => { this.error = 'Color del jugador no determinado'; });
      console.warn('[PartidaVM] seleccionarCasilla: miColor no definido');
      return;
    }

    // Si ya hay un movimiento pendiente, bloquear nuevas selecciones/movimientos
    if (this.movimientoPendiente) {
      runInAction(() => { this.error = 'Hay un movimiento pendiente. Confirma o deshaz antes de mover.'; });
      console.warn('[PartidaVM] seleccionarCasilla: intento con movimiento pendiente');
      return;
    }

    if (!this.esMiTurno()) {
      // No es el turno del jugador local: informar en consola y en UI
      runInAction(() => { this.error = 'No es tu turno'; });
      console.warn('[PartidaVM] seleccionarCasilla: intento fuera de turno');
      return;
    }

    // Limpiar error previo si todo correcto
    runInAction(() => { this.error = null; });

    const pieza = this.tablero.obtenerPieza(posicion);

    // Si hay pieza seleccionada y clickeamos un movimiento posible
    if (this.piezaSeleccionada && this.movimientosPosibles.some(m => posicionesIguales(m, posicion))) {
      console.log('[TRACE PartidaVM] destino seleccionado es movimiento posible', { piezaSeleccionada: this.piezaSeleccionada.id, destino: posicion });
      this.realizarMovimientoLocal(this.piezaSeleccionada, posicion);
      return;
    }

    // Si hay pieza propia en la casilla, seleccionarla
    if (pieza && pieza.color === this.miColor) {
      console.log('[TRACE PartidaVM] seleccionando pieza propia', { piezaId: pieza.id, posicion });
      const tablero = this.tablero; // Capturar para evitar error de null
      runInAction(() => {
        this.piezaSeleccionada = pieza;
        this.movimientosPosibles = tablero?.obtenerMovimientosPosibles(pieza) || [];
      });
      return;
    }

    // Si no, deseleccionar
    console.log('[TRACE PartidaVM] casilla vacía o pieza enemiga (no seleccionada)', { posicion });
    runInAction(() => {
      this.piezaSeleccionada = null;
      this.movimientosPosibles = [];
    });
  }

  /**
   * Realiza un movimiento local (envía al backend)
   */
  private async realizarMovimientoLocal(pieza: Pieza, destino: Posicion): Promise<void> {
    console.log('[TRACE PartidaVM] realizarMovimientoLocal called with pieza:', pieza, 'destino:', destino);
    if (!this.tablero || !this.partida) {
      console.log('[TRACE PartidaVM] Early return: missing tablero or partida');
      return;
    }

    // Detectar si es enroque
    this.proximoMovimientoEsEnroque =
      pieza.tipo === 'Rey' && Math.abs(pieza.posicion.columna - destino.columna) === 2;
    console.log('[TRACE PartidaVM] esEnroque:', this.proximoMovimientoEsEnroque);

    // Crear movimiento
    const piezaCapturada = this.tablero.obtenerPieza(destino);

    // Detectar si es promoción
    const esPromocion = pieza.tipo === 'Peon' &&
                       ((pieza.color === 'Blanca' && destino.fila === 0) ||
                        (pieza.color === 'Negra' && destino.fila === 7));

    console.log('[TRACE PartidaVM] Detección de promoción:', {
      esPeon: pieza.tipo === 'Peon',
      colorPieza: pieza.color,
      destinoFila: destino.fila,
      esPromocion
    });

    const movimiento = new Movimiento({
      id: `mov-${Date.now()}`,
      piezaId: pieza.id,
      origen: pieza.posicion,
      destino,
      piezaCapturada: piezaCapturada?.id || null,
      esEnroque: this.proximoMovimientoEsEnroque,
      esPromocion,
    });
    console.log('[TRACE PartidaVM] movimiento created:', movimiento);

    // Enviar el movimiento al backend (RealizarMovimiento)
    try {
      console.log('[TRACE PartidaVM] Enviando movimiento al backend...');
      await this.ajedrezUseCase.moverPieza(movimiento);

      // El backend responderá con "MovimientoRealizado" que actualizará el tablero
      // Marcar el movimiento como pendiente de confirmación
      runInAction(() => {
        this.movimientoPendiente = movimiento;
        this.piezaSeleccionada = null;
        this.movimientosPosibles = [];
        this.error = null;
      });

      console.log('[TRACE PartidaVM] Movimiento enviado al backend, esperando confirmación del usuario');
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? String(error);
        this.piezaSeleccionada = null;
        this.movimientosPosibles = [];
      });
      console.error('[ERROR PartidaVM] Error al enviar movimiento al backend:', error);
    }
  }


  /**
   * Confirma un movimiento pendiente (envía al servidor)
   */
  async confirmarMovimiento(): Promise<void> {
    console.log('[TRACE PartidaVM] confirmarMovimiento called');
    try {
      if (!this.movimientoPendiente) {
        console.log('[PartidaVM] No movimiento pendiente');
        runInAction(() => { this.error = 'No hay movimiento pendiente para confirmar'; });
        return;
      }

      console.log('[TRACE PartidaVM] Confirmando movimiento en el servidor...');

      // Check if the pending movement is a promotion
      const esPromocion = this.movimientoPendiente.esPromocion;

      // Llamar a confirmarJugada() que mapea a ConfirmarMovimiento del backend
      await this.ajedrezUseCase.confirmarJugada();
      console.log('[TRACE PartidaVM] Movimiento confirmado en el backend');

      // El backend enviará TurnoActualizado y PromocionRequerida (si aplica)
      runInAction(() => {
        // Don't clear movimientoPendiente or mostrarPromocion if it's a promotion
        // They will be cleared after the promotion is completed
        if (!esPromocion) {
          this.movimientoPendiente = null;
          this.mostrarPromocion = false;
        }
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? String(error);
      });
      console.error('Error confirmando movimiento:', error);

      // Si falla la confirmación, deshacer el movimiento
      try {
        await this.deshacerMovimiento();
      } catch (err) {
        console.error('Error deshaciendo tras fallo de confirmación:', err);
      }
    }
  }

  /**
   * Deshace el último movimiento
   */
  async deshacerMovimiento(): Promise<void> {
    try {
      if (!this.tablero || !this.partida) {
        runInAction(() => { this.error = 'No hay partida activa'; });
        return;
      }

      // FIX: SIEMPRE llamar al backend porque el movimiento ya se envió con moverPieza()
      // El backend tiene el movimiento pendiente y necesita deshacerlo
      if (this.movimientoPendiente) {
        console.log('[TRACE PartidaVM] Deshaciendo movimiento pendiente en el backend');
        await this.ajedrezUseCase.deshacerJugada();

        runInAction(() => {
          this.movimientoPendiente = null;
          this.piezaSeleccionada = null;
          this.movimientosPosibles = [];
          this.mostrarPromocion = false;
          this.error = null;
        });
        // El backend enviará TableroActualizado que sincronizará el estado
        return;
      }

      // Si no hay movimiento pendiente, no debería haber nada que deshacer
      runInAction(() => { this.error = 'No hay movimiento pendiente para deshacer'; });
      console.warn('[PartidaVM] deshacerMovimiento: no hay movimiento pendiente');
    } catch (error: any) {
      runInAction(() => { this.error = error?.message ?? String(error); });
      console.error('Error deshaciendo:', error);
    }
  }

  /**
   * Solicita tablas
   */
  async solicitarTablas(): Promise<void> {
    try {
      await this.ajedrezUseCase.pedirTablas();
      runInAction(() => {
        this.solicitadasTablas = true;
        this.error = null;
      });
      console.log('[PartidaVM] solicitarTablas invoked');
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? String(error);
      });
      console.error('Error solicitando tablas:', error);
    }
  }

  /**
   * Retira solicitud de tablas
   */
  async retirarTablas(): Promise<void> {
    try {
      await this.ajedrezUseCase.cancelarTablas();
      runInAction(() => {
        this.solicitadasTablas = false;
        this.tablasOfrecidas = false;
        this.error = null;
      });
      console.log('[PartidaVM] retirarTablas invoked');
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message ?? String(error);
      });
      console.error('Error retirando tablas:', error);
    }
  }

  /**
   * Se rinde de la partida
   */
  async rendirse(): Promise<void> {
    console.log('[PartidaVM] rendirse() invoked - starting');
    try {
      console.log('[PartidaVM] Calling ajedrezUseCase.rendirsePartida()');
      await this.ajedrezUseCase.rendirsePartida();
      runInAction(() => { this.error = null; });
      console.log('[PartidaVM] rendirse completed successfully');
    } catch (error: any) {
      console.error('[PartidaVM] Error en rendirse:', error);
      runInAction(() => {
        this.error = `Error al rendirse: ${error?.message ?? String(error)}`;
      });
    }
  }

  /**
   * Promociona el peón
   */
  async promocionarPeon(tipo: TipoPieza): Promise<void> {
    try {
      if (!this.movimientoPendiente) {
        throw new Error('No hay movimiento pendiente de promoción');
      }

      console.log('[PartidaVM] Enviando promoción al backend:', tipo);
      await this.ajedrezUseCase.seleccionarPromocion(tipo);

      runInAction(() => {
        this.mostrarPromocion = false;
        this.movimientoPendiente = null;
        this.error = null;
      });

      console.log('[PartidaVM] Promoción completada y movimiento limpiado');
    } catch (error: any) {
      runInAction(() => { this.error = error?.message ?? String(error); });
      console.error('Error promocionando:', error);
    }
  }

  /**
   * Solicita reinicio de partida
   */
  async solicitarReinicio(): Promise<void> {
    try {
      await this.ajedrezUseCase.pedirReinicio();
      runInAction(() => { this.solicitadoReinicio = true; this.error = null; });
      console.log('[PartidaVM] solicitarReinicio invoked');
    } catch (error: any) {
      runInAction(() => { this.error = error?.message ?? String(error); });
      console.error('Error solicitando reinicio:', error);
    }
  }

  /**
   * Retira solicitud de reinicio
   */
  async retirarReinicio(): Promise<void> {
    try {
      await this.ajedrezUseCase.cancelarReinicio();
      runInAction(() => {
        this.solicitadoReinicio = false;
        this.oponenteSolicitoReinicio = false;
        this.error = null;
      });
      console.log('[PartidaVM] retirarReinicio invoked');
    } catch (error: any) {
      runInAction(() => { this.error = error?.message ?? String(error); });
      console.error('Error retirando reinicio:', error);
    }
  }

  /**
   * Vuelve al menú principal (desuscribirse de eventos)
   */
  volverAlMenu(): void {
    this.ajedrezUseCase.unsubscribeAll();
    this.reset();
  }

  // Handlers de eventos del servidor

  handleMovimiento(movimiento: Movimiento, tablero: Tablero): void {
    console.log('[PartidaVM] handleMovimiento recibido del backend', {
      movId: movimiento.id,
      esPromocion: movimiento.esPromocion,
      piezasEnTablero: tablero.piezas.length,
      piezasEliminadas: tablero.piezas.filter(p => p.eliminada).length
    });

    runInAction(() => {
      // FIX: Hacer observable el tablero recibido para que MobX detecte cambios
      safeObservable(tablero);

      // Actualizar el tablero con el estado del backend
      this.tablero = tablero;
      if (this.partida) {
        this.partida.tablero = tablero;
      }
      this.actualizarPiezasEliminadas();
      this.error = null;

      // Si el movimiento es de promoción, mostrar el modal al jugador que movió
      if (movimiento.esPromocion && this.movimientoPendiente?.id === movimiento.id) {
        this.mostrarPromocion = true;
        console.log('[PartidaVM] Movimiento de promoción detectado, mostrando modal');
      }
    });

    console.log('[PartidaVM] Tablero actualizado desde el backend', {
      piezasActuales: this.tablero?.piezas.length
    });
  }

  handleTableroActualizado(tablero: Tablero): void {
    console.log('[PartidaVM] handleTableroActualizado recibido del backend (deshacer)', {
      piezasEnTablero: tablero.piezas.length,
      piezasEliminadas: tablero.piezas.filter(p => p.eliminada).length
    });

    runInAction(() => {
      // FIX: Hacer observable el tablero recibido para que MobX detecte cambios
      safeObservable(tablero);

      // Actualizar el tablero con el estado del backend después de deshacer
      this.tablero = tablero;
      if (this.partida) {
        this.partida.tablero = tablero;
      }
      this.actualizarPiezasEliminadas();
      this.error = null;
    });

    console.log('[PartidaVM] Tablero sincronizado después de deshacer', {
      piezasActuales: this.tablero?.piezas.length
    });
  }

  handleTurnoActualizado(turno: Color, numeroTurno: number): void {
    runInAction(() => {
      if (this.partida) {
        this.partida.turnoActual = turno;
        this.partida.numeroTurnos = numeroTurno;
        this.actualizarMensajeTurno();
        this.error = null;
      }
    });
    console.log('[PartidaVM] handleTurnoActualizado recibido', { turno, numeroTurno });
  }

  handleTablasActualizadas(blancas: boolean, negras: boolean): void {
    runInAction(() => {
      if (this.partida) {
        this.partida.tablasBlancas = blancas;
        this.partida.tablasNegras = negras;

        // Si el oponente ofrece tablas
        if (this.miColor === 'Blanca' && negras) {
          this.tablasOfrecidas = true;
        } else if (this.miColor === 'Negra' && blancas) {
          this.tablasOfrecidas = true;
        }
        this.error = null;
      }
    });
    console.log('[PartidaVM] handleTablasActualizadas recibido', { blancas, negras });
  }

  handlePartidaFinalizada(resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string): void {
    runInAction(() => {
      this.mostrarFinPartida = true;
      if (this.partida) {
        this.partida.estado = 'Finalizada';
        this.partida.resultado = resultado;
        this.partida.tipoFin = tipo;
      }
      this.error = null;
    });
    console.log('[PartidaVM] handlePartidaFinalizada recibido', { resultado, tipo, ganador });
  }

  handleJaqueActualizado(hayJaque: boolean): void {
    runInAction(() => {
      if (this.partida) {
        this.partida.hayJaque = hayJaque;
        if (hayJaque) {
          this.mensajeJaque = '¡Jaque!';
        } else {
          this.mensajeJaque = null;
        }
        this.error = null;
      }
    });
    console.log('[PartidaVM] handleJaqueActualizado recibido', hayJaque);
  }

  handlePromocionRequerida(): void {
    runInAction(() => {
      this.mostrarPromocion = true;
    });
    console.log('[PartidaVM] handlePromocionRequerida recibido');
  }

  handleReinicioActualizado(blancas: boolean, negras: boolean): void {
    runInAction(() => {
      if (this.miColor === 'Blanca') {
        this.solicitadoReinicio = blancas;
        this.oponenteSolicitoReinicio = negras;
      } else {
        this.solicitadoReinicio = negras;
        this.oponenteSolicitoReinicio = blancas;
      }
    });
    console.log('[PartidaVM] handleReinicioActualizado recibido', { blancas, negras, miColor: this.miColor });
  }

  handleReinicioPartida(partida: Partida): void {
    console.log('[PartidaVM] handleReinicioPartida: nueva partida recibida', partida.id);
    runInAction(() => {
      safeObservable(partida);
      safeObservable(partida.tablero);
      this.partida = partida;
      this.tablero = partida.tablero;

      // Re-determine color in case server swaps colors for rematch
      const nnNorm = (partida.jugadorNegras?.nombre ?? '').trim().toLowerCase();
      const miNombreNorm = this.miNombre.trim().toLowerCase();
      if (miNombreNorm && nnNorm && miNombreNorm === nnNorm) {
        this.miColor = 'Negra';
        this.nombreOponente = partida.jugadorBlancas?.nombre ?? '';
      } else {
        this.miColor = 'Blanca';
        this.nombreOponente = partida.jugadorNegras?.nombre ?? '';
      }

      this.piezaSeleccionada = null;
      this.movimientosPosibles = [];
      this.movimientoPendiente = null;
      this.mostrarPromocion = false;
      this.mostrarFinPartida = false;
      this.mensajeJaque = null;
      this.error = null;
      this.tablasOfrecidas = false;
      this.solicitadasTablas = false;
      this.solicitadoReinicio = false;
      this.oponenteSolicitoReinicio = false;
      this.oponenteAbandono = false;
      this.piezasEliminadasBlancas.clear();
      this.piezasEliminadasNegras.clear();
      this.actualizarMensajeTurno();
    });
  }

  handleOponenteAbandono(_connectionId: string): void {
    runInAction(() => {
      this.oponenteAbandono = true;
    });
    console.log('[PartidaVM] handleOponenteAbandono: oponente se fue');
  }

  handleError(error: string): void {
    runInAction(() => {
      this.error = error;
    });
    console.error('[PartidaVM] handleError recibido', error);
  }

  // Métodos auxiliares

  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      if (this.partida) {
        this.partida.incrementarTiempo(1);
      }
    }, 1000);
  }

  private esMiTurno(): boolean {
    return this.partida?.turnoActual === this.miColor;
  }

  private actualizarPiezasEliminadas(): void {
    if (!this.tablero) return;

    this.piezasEliminadasBlancas.clear();
    this.piezasEliminadasNegras.clear();

    for (const pieza of this.tablero.piezas) {
      if (pieza.eliminada) {
        const map = pieza.color === 'Blanca' ? this.piezasEliminadasBlancas : this.piezasEliminadasNegras;
        map.set(pieza.tipo, (map.get(pieza.tipo) || 0) + 1);
      }
    }
  }

  private actualizarMensajeTurno(): void {
    if (!this.partida) return;

    // Mostrar el nombre del jugador al que le toca mover (usar turnoActual)
    try {
      const nombreTurno = this.partida.turnoActual === 'Blanca'
        ? this.partida.jugadorBlancas.nombre
        : this.partida.jugadorNegras.nombre;

      this.mensajeTurno = `Turno de: ${nombreTurno ?? 'Jugador'}`;
    } catch (err) {
      this.mensajeTurno = 'Turno de: Jugador';
    }
  }

  reset(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.partida = null;
    this.tablero = null;
    this.miColor = null;
    this.nombreOponente = '';
    this.piezaSeleccionada = null;
    this.movimientosPosibles = [];
    this.movimientoPendiente = null;
    this.mostrarPromocion = false;
    this.mostrarFinPartida = false;
    this.mensajeTurno = null;
    this.mensajeJaque = null;
    this.error = null;
    this.tablasOfrecidas = false;
    this.solicitadasTablas = false;
    this.solicitadoReinicio = false;
    this.oponenteSolicitoReinicio = false;
    this.oponenteAbandono = false;
    this.piezasEliminadasBlancas.clear();
    this.piezasEliminadasNegras.clear();
  }
}
