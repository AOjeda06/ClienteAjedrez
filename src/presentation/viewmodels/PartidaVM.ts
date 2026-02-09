/**
 * ViewModel para la pantalla de partida
 * Gestiona toda la lógica de juego
 */

import { makeAutoObservable } from 'mobx';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { Partida } from '../../domain/entities/Partida';
import { Tablero } from '../../domain/entities/Tablero';
import { Pieza } from '../../domain/entities/Pieza';
import { Movimiento } from '../../domain/entities/Movimiento';
import { Color, Posicion, ResultadoPartida, TipoFinPartida, TipoPieza, ID, posicionesIguales } from '../../core/types';

export class PartidaVM {
  partida: Partida | null = null;
  tablero: Tablero | null = null;
  miColor: Color | null = null;
  nombreOponente: string = '';
  piezaSeleccionada: Pieza | null = null;
  movimientosPosibles: Posicion[] = [];
  movimientoPendiente: Movimiento | null = null;
  mostrarPromocion: boolean = false;
  mostrarFinPartida: boolean = false;
  mensajeTurno: string | null = null;
  mensajeJaque: string | null = null;
  piezasEliminadasBlancas: Map<TipoPieza, number> = new Map();
  piezasEliminadasNegras: Map<TipoPieza, number> = new Map();
  error: string | null = null;
  tablasOfrecidas: boolean = false;
  solicitadasTablas: boolean = false;
  solicitadoReinicio: boolean = false;
  oponenteSolicitoReinicio: boolean = false;

  private ajedrezUseCase: IAjedrezUseCase;
  private proximoMovimientoEsEnroque: boolean = false;

  constructor(useCase: IAjedrezUseCase) {
    this.ajedrezUseCase = useCase;
    makeAutoObservable(this);
  }

  inicializarPartida(partida: Partida, miColor: Color): void {
    this.partida = partida;
    this.miColor = miColor;
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

    // Suscribirse a eventos
    this.ajedrezUseCase.subscribeMovimiento(this.handleMovimiento.bind(this));
    this.ajedrezUseCase.subscribeTurno(this.handleTurnoActualizado.bind(this));
    this.ajedrezUseCase.subscribeJaque(this.handleJaqueActualizado.bind(this));
    this.ajedrezUseCase.subscribeFinPartida(this.handlePartidaFinalizada.bind(this));
    this.ajedrezUseCase.subscribePromocion(this.handlePromocionRequerida.bind(this));
    this.ajedrezUseCase.subscribeTablas(this.handleTablasActualizadas.bind(this));
    this.ajedrezUseCase.subscribeReinicio(this.handleReinicioActualizado.bind(this));
    this.ajedrezUseCase.subscribeError(this.handleError.bind(this));
  }

  /**
   * Selecciona una casilla (puede ser pieza o destino de movimiento)
   */
  seleccionarCasilla(posicion: Posicion): void {
    if (!this.tablero || !this.miColor || !this.esMiTurno()) {
      return;
    }

    const pieza = this.tablero.obtenerPieza(posicion);

    // Si hay pieza seleccionada y clickeamos un movimiento posible
    if (this.piezaSeleccionada && this.movimientosPosibles.some(m => posicionesIguales(m, posicion))) {
      this.realizarMovimientoLocal(this.piezaSeleccionada, posicion);
      return;
    }

    // Si hay pieza propia en la casilla, seleccionarla
    if (pieza && pieza.color === this.miColor) {
      this.piezaSeleccionada = pieza;
      this.movimientosPosibles = this.tablero.obtenerMovimientosPosibles(pieza);
      return;
    }

    // Si no, deseleccionar
    this.piezaSeleccionada = null;
    this.movimientosPosibles = [];
  }

  /**
   * Realiza un movimiento local (sin confirmar aún)
   */
  private realizarMovimientoLocal(pieza: Pieza, destino: Posicion): void {
    if (!this.tablero || !this.partida) return;

    // Detectar si es enroque
    this.proximoMovimientoEsEnroque = 
      pieza.tipo === 'Rey' && Math.abs(pieza.posicion.columna - destino.columna) === 2;

    // Crear movimiento
    const piezaCapturada = this.tablero.obtenerPieza(destino);
    const movimiento = new Movimiento({
      id: `mov-${Date.now()}`,
      piezaId: pieza.id,
      origen: pieza.posicion,
      destino,
      piezaCapturada: piezaCapturada?.id || null,
      esEnroque: this.proximoMovimientoEsEnroque,
      esPromocion: pieza.tipo === 'Peon' && 
                   ((pieza.color === 'Blanca' && destino.fila === 0) ||
                    (pieza.color === 'Negra' && destino.fila === 7)),
    });

    // Aplicar el movimiento al tablero local
    this.partida.realizarMovimiento(movimiento, this.proximoMovimientoEsEnroque);

    this.movimientoPendiente = movimiento;
    this.piezaSeleccionada = null;
    this.movimientosPosibles = [];

    // Si es promoción, mostrar modal
    if (movimiento.esPromocion) {
      this.mostrarPromocion = true;
    } else {
      // Si no, confirmar automáticamente
      this.confirmarMovimiento();
    }
  }

  /**
   * Confirma un movimiento pendiente (envía al servidor)
   */
  async confirmarMovimiento(): Promise<void> {
    try {
      if (!this.movimientoPendiente) {
        throw new Error('No hay movimiento pendiente para confirmar');
      }

      await this.ajedrezUseCase.moverPieza(this.movimientoPendiente);
      this.movimientoPendiente = null;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error confirmando movimiento:', error);
      // Deshacer el movimiento local
      if (this.tablero && this.partida) {
        this.deshacerMovimiento();
      }
    }
  }

  /**
   * Deshace el último movimiento
   */
  async deshacerMovimiento(): Promise<void> {
    try {
      if (!this.tablero || !this.partida) return;

      this.partida.deshacerMovimiento();
      await this.ajedrezUseCase.deshacerJugada();
      this.piezaSeleccionada = null;
      this.movimientosPosibles = [];
      this.movimientoPendiente = null;
      this.mostrarPromocion = false;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error deshaciendo:', error);
    }
  }

  /**
   * Solicita tablas
   */
  async solicitarTablas(): Promise<void> {
    try {
      await this.ajedrezUseCase.pedirTablas();
      this.solicitadasTablas = true;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error solicitando tablas:', error);
    }
  }

  /**
   * Retira solicitud de tablas
   */
  async retirarTablas(): Promise<void> {
    try {
      await this.ajedrezUseCase.cancelarTablas();
      this.solicitadasTablas = false;
      this.tablasOfrecidas = false;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error retirando tablas:', error);
    }
  }

  /**
   * Se rinde de la partida
   */
  async rendirse(): Promise<void> {
    try {
      await this.ajedrezUseCase.rendirsePartida();
    } catch (error: any) {
      this.error = error.message;
      console.error('Error rindiendo:', error);
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

      await this.ajedrezUseCase.seleccionarPromocion(tipo);
      this.mostrarPromocion = false;
      this.movimientoPendiente = null;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error promocionando:', error);
    }
  }

  /**
   * Solicita reinicio de partida
   */
  async solicitarReinicio(): Promise<void> {
    try {
      await this.ajedrezUseCase.pedirReinicio();
      this.solicitadoReinicio = true;
    } catch (error: any) {
      this.error = error.message;
      console.error('Error solicitando reinicio:', error);
    }
  }

  /**
   * Retira solicitud de reinicio
   */
  async retirarReinicio(): Promise<void> {
    try {
      await this.ajedrezUseCase.cancelarReinicio();
      this.solicitadoReinicio = false;
      this.oponenteSolicitoReinicio = false;
    } catch (error: any) {
      this.error = error.message;
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
    this.tablero = tablero;
    this.actualizarPiezasEliminadas();
  }

  handleTurnoActualizado(turno: Color, numeroTurno: number): void {
    if (this.partida) {
      this.partida.turnoActual = turno;
      this.partida.numeroTurnos = numeroTurno;
      this.actualizarMensajeTurno();
    }
  }

  handleTablasActualizadas(blancas: boolean, negras: boolean): void {
    if (this.partida) {
      this.partida.tablasBlancas = blancas;
      this.partida.tablasNegras = negras;

      // Si el oponente ofrece tablas
      if (this.miColor === 'Blanca' && negras) {
        this.tablasOfrecidas = true;
      } else if (this.miColor === 'Negra' && blancas) {
        this.tablasOfrecidas = true;
      }
    }
  }

  handlePartidaFinalizada(resultado: ResultadoPartida, tipo: TipoFinPartida, ganador?: string): void {
    this.mostrarFinPartida = true;
    if (this.partida) {
      this.partida.estado = 'Finalizada';
      this.partida.resultado = resultado;
      this.partida.tipoFin = tipo;
    }
  }

  handleJaqueActualizado(hayJaque: boolean): void {
    if (this.partida) {
      this.partida.hayJaque = hayJaque;
      if (hayJaque) {
        this.mensajeJaque = '¡Jaque!';
      } else {
        this.mensajeJaque = null;
      }
    }
  }

  handlePromocionRequerida(): void {
    this.mostrarPromocion = true;
  }

  handleReinicioActualizado(blancas: boolean, negras: boolean): void {
    if (this.miColor === 'Blanca') {
      this.oponenteSolicitoReinicio = negras;
    } else {
      this.oponenteSolicitoReinicio = blancas;
    }
  }

  handleError(error: string): void {
    this.error = error;
  }

  // Métodos auxiliares

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
    if (!this.partida || !this.miColor) return;

    if (this.esMiTurno()) {
      this.mensajeTurno = 'Tu turno';
    } else {
      this.mensajeTurno = `Turno de ${this.nombreOponente}`;
    }
  }

  reset(): void {
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
    this.piezasEliminadasBlancas.clear();
    this.piezasEliminadasNegras.clear();
  }
}
