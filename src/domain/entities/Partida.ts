/**
 * Entidad Partida
 * Representa una partida de ajedrez con toda su lógica de estado
 */

import { ID, Color, EstadoPartida, ResultadoPartida, TipoFinPartida, TipoPieza } from '../types';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';
import { Pieza } from './Pieza';
import { Movimiento } from './Movimiento';

export interface PartidaProps {
  id: ID;
  salaId: ID;
  tablero: Tablero;
  jugadorBlancas: Jugador;
  jugadorNegras: Jugador;
  turnoActual?: Color;
  numeroTurnos?: number;
  tiempoTranscurrido?: number;
  estado?: EstadoPartida;
  resultado?: ResultadoPartida;
  tipoFin?: TipoFinPartida | null;
  tablasBlancas?: boolean;
  tablasNegras?: boolean;
  hayJaque?: boolean;
  hayJaqueMate?: boolean;
}

export class Partida {
  id: ID;
  salaId: ID;
  tablero: Tablero;
  jugadorBlancas: Jugador;
  jugadorNegras: Jugador;
  turnoActual: Color;
  numeroTurnos: number;
  tiempoTranscurrido: number;
  estado: EstadoPartida;
  resultado: ResultadoPartida;
  tipoFin: TipoFinPartida | null;
  tablasBlancas: boolean;
  tablasNegras: boolean;
  hayJaque: boolean;
  hayJaqueMate: boolean;

  constructor(props: PartidaProps) {
    this.id = props.id;
    this.salaId = props.salaId;
    this.tablero = props.tablero;
    this.jugadorBlancas = props.jugadorBlancas;
    this.jugadorNegras = props.jugadorNegras;
    this.turnoActual = props.turnoActual ?? 'Blanca';
    this.numeroTurnos = props.numeroTurnos ?? 0;
    this.tiempoTranscurrido = props.tiempoTranscurrido ?? 0;
    this.estado = props.estado ?? 'Esperando';
    this.resultado = props.resultado ?? null;
    this.tipoFin = props.tipoFin ?? null;
    this.tablasBlancas = props.tablasBlancas ?? false;
    this.tablasNegras = props.tablasNegras ?? false;
    this.hayJaque = props.hayJaque ?? false;
    this.hayJaqueMate = props.hayJaqueMate ?? false;
  }

  /**
   * Cambia el turno al jugador opuesto
   */
  cambiarTurno(): void {
    this.turnoActual = this.turnoActual === 'Blanca' ? 'Negra' : 'Blanca';
    this.numeroTurnos++;
  }

  /**
   * Incrementa el tiempo transcurrido en la partida
   */
  incrementarTiempo(segundos: number): void {
    this.tiempoTranscurrido += segundos;
  }

  /**
   * Un jugador solicita tablas
   */
  solicitarTablas(color: Color): void {
    if (color === 'Blanca') {
      this.tablasBlancas = true;
    } else {
      this.tablasNegras = true;
    }
  }

  /**
   * Un jugador retira su solicitud de tablas
   */
  retirarTablas(color: Color): void {
    if (color === 'Blanca') {
      this.tablasBlancas = false;
    } else {
      this.tablasNegras = false;
    }
  }

  /**
   * Ambos jugadores aceptan tablas
   */
  aceptarTablas(): void {
    this.estado = 'Finalizada';
    this.resultado = 'Empate';
    this.tipoFin = 'Tablas';
  }

  /**
   * Un jugador se rinde
   */
  rendirse(color: Color): void {
    this.estado = 'Finalizada';
    const ganador = color === 'Blanca' ? 'Negra' : 'Blanca';
    this.resultado = ganador === this.jugadorBlancas.color ? 'Victoria' : 'Derrota';
    this.tipoFin = 'Rendicion';
  }

  /**
   * Establece si hay jaque
   */
  establecerJaque(valor: boolean): void {
    this.hayJaque = valor;
  }

  /**
   * Establece si hay jaque mate
   */
  establecerJaqueMate(): void {
    this.hayJaqueMate = true;
    this.estado = 'Finalizada';
    const ganador = this.turnoActual === 'Blanca' ? 'Negra' : 'Blanca';
    this.resultado = ganador === this.jugadorBlancas.color ? 'Victoria' : 'Derrota';
    this.tipoFin = 'JaqueMate';
  }

  /**
   * Finaliza la partida
   */
  finalizarPartida(tipo: TipoFinPartida, ganador?: Color): void {
    this.estado = 'Finalizada';
    this.tipoFin = tipo;

    if (tipo === 'JaqueMate' && ganador) {
      this.resultado = ganador === this.jugadorBlancas.color ? 'Victoria' : 'Derrota';
    } else if (tipo === 'Tablas') {
      this.resultado = 'Empate';
    } else if (tipo === 'Rendicion' && ganador) {
      this.resultado = ganador === this.jugadorBlancas.color ? 'Victoria' : 'Derrota';
    }
  }

  /**
   * Realiza un movimiento en la partida
   * Valida y aplica el movimiento al tablero
   */
  realizarMovimiento(movimiento: Movimiento, esEnroque: boolean = false): void {
    const pieza = this.tablero.piezas.find(p => p.id === movimiento.piezaId);
    if (!pieza) {
      throw new Error(`Pieza con ID ${movimiento.piezaId} no encontrada`);
    }

    // Verificar que la pieza pertenece al jugador actual
    if (pieza.color !== this.turnoActual) {
      throw new Error(`No es el turno de ${pieza.color}`);
    }

    // Aplicar el movimiento
    pieza.mover(movimiento.destino);

    // Si hay pieza capturada, eliminarla
    if (movimiento.piezaCapturada) {
      this.tablero.removerPieza(movimiento.piezaCapturada);
    }

    // Manejar enroque (mover la torre)
    if (esEnroque) {
      this.aplicarEnroque(movimiento);
    }

    // Registrar el movimiento
    this.tablero.registrarMovimiento(movimiento);

    // Actualizar estado de jaque/jaque mate
    this.cambiarTurno();
    this.hayJaque = this.tablero.hayJaque(this.turnoActual);
    this.hayJaqueMate = this.tablero.hayJaqueMate(this.turnoActual);

    if (this.hayJaqueMate) {
      this.establecerJaqueMate();
    }
  }

  /**
   * Aplica la lógica especial del enroque (movimiento de la torre)
   */
  private aplicarEnroque(movimiento: Movimiento): void {
    const filaRey = movimiento.destino.fila;
    const esEnroqueCorto = movimiento.destino.columna === 6;

    if (esEnroqueCorto) {
      // Enroque corto: Torre se mueve de columna 7 a columna 5
      const torre = this.tablero.obtenerPieza({ fila: filaRey, columna: 7 });
      if (torre) {
        torre.mover({ fila: filaRey, columna: 5 });
      }
    } else {
      // Enroque largo: Torre se mueve de columna 0 a columna 3
      const torre = this.tablero.obtenerPieza({ fila: filaRey, columna: 0 });
      if (torre) {
        torre.mover({ fila: filaRey, columna: 3 });
      }
    }
  }

  /**
   * Confirma un movimiento (en juego en línea, esto envía al servidor)
   */
  confirmarMovimiento(): void {
    const ultimoMovimiento = this.tablero.obtenerUltimoMovimiento();
    if (ultimoMovimiento) {
      ultimoMovimiento.confirmar();
    }
  }

  /**
   * Deshace un movimiento
   * Nota: Esta es una implementación básica para movimientos locales
   */
  deshacerMovimiento(): void {
    if (this.tablero.movimientos.length === 0) {
      throw new Error('No hay movimientos para deshacer');
    }

    const ultimoMovimiento = this.tablero.movimientos.pop();
    if (!ultimoMovimiento) return;

    // Deshace el movimiento de la pieza
    const pieza = this.tablero.piezas.find(p => p.id === ultimoMovimiento.piezaId);
    if (pieza) {
      pieza.mover(ultimoMovimiento.origen);
    }

    // Si hay pieza capturada, restaurarla
    if (ultimoMovimiento.piezaCapturada) {
      const piezaCapturada = this.tablero.piezas.find(p => p.id === ultimoMovimiento.piezaCapturada);
      if (piezaCapturada) {
        piezaCapturada.eliminada = false;
      }
    }

    // Deshace cambio de turno
    this.cambiarTurno();

    // Actualizar estado
    this.hayJaque = this.tablero.hayJaque(this.turnoActual);
    this.hayJaqueMate = false;
  }

  /**
   * Promociona un peón
   */
  promocionarPeon(piezaId: ID, nuevoTipo: TipoPieza): void {
    const pieza = this.tablero.piezas.find(p => p.id === piezaId);
    if (!pieza || pieza.tipo !== 'Peon') {
      throw new Error('La pieza a promocionar no es un peón');
    }

    pieza.promocionar(nuevoTipo);
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      salaId: this.salaId,
      tablero: this.tablero.toPlain(),
      jugadorBlancas: this.jugadorBlancas.toPlain(),
      jugadorNegras: this.jugadorNegras.toPlain(),
      turnoActual: this.turnoActual,
      numeroTurnos: this.numeroTurnos,
      tiempoTranscurrido: this.tiempoTranscurrido,
      estado: this.estado,
      resultado: this.resultado,
      tipoFin: this.tipoFin,
      tablasBlancas: this.tablasBlancas,
      tablasNegras: this.tablasNegras,
      hayJaque: this.hayJaque,
      hayJaqueMate: this.hayJaqueMate,
    };
  }

  /**
   * Crea una instancia desde un DTO
   * Acepta tanto camelCase como PascalCase en las propiedades entrantes.
   */
  static createFromDTO(dto: any): Partida {
    if (!dto) {
      throw new Error('DTO incompleto para crear Partida');
    }

    // Aceptar PascalCase o camelCase
    const id = dto.id ?? dto.Id ?? null;
    const salaId = dto.salaId ?? dto.SalaId ?? null;

    // Tablero y jugadores pueden venir en PascalCase o camelCase
    const tableroDto = dto.tablero ?? dto.Tablero ?? null;
    const jugadorBlancasDto = dto.jugadorBlancas ?? dto.JugadorBlancas ?? null;
    const jugadorNegrasDto = dto.jugadorNegras ?? dto.JugadorNegras ?? null;

    // Campos opcionales con nombres alternativos
    const turnoActual = dto.turnoActual ?? dto.TurnoActual ?? dto.turno ?? dto.Turno ?? 'Blanca';
    const numeroTurnos = dto.numeroTurnos ?? dto.NumeroTurnos ?? dto.numeroTurnos ?? dto.numeroTurno ?? 0;
    const tiempoTranscurrido = dto.tiempoTranscurrido ?? dto.TiempoTranscurrido ?? 0;
    const estado = dto.estado ?? dto.Estado ?? 'Esperando';
    const resultado = dto.resultado ?? dto.Resultado ?? null;
    const tipoFin = dto.tipoFin ?? dto.TipoFin ?? null;
    const tablasBlancas = dto.tablasBlancas ?? dto.TablasBlancas ?? false;
    const tablasNegras = dto.tablasNegras ?? dto.TablasNegras ?? false;
    const hayJaque = dto.hayJaque ?? dto.HayJaque ?? false;
    const hayJaqueMate = dto.hayJaqueMate ?? dto.HayJaqueMate ?? false;

    if (!id || !salaId || !tableroDto || !jugadorBlancasDto || !jugadorNegrasDto) {
      throw new Error('DTO incompleto para crear Partida');
    }

    // Mapear subobjetos usando sus helpers
    const tablero = tableroDto instanceof Tablero ? tableroDto : Tablero.createFromDTO(tableroDto);
    const jugadorBlancas = jugadorBlancasDto instanceof Jugador ? jugadorBlancasDto : Jugador.createFromDTO(jugadorBlancasDto);
    const jugadorNegras = jugadorNegrasDto instanceof Jugador ? jugadorNegrasDto : Jugador.createFromDTO(jugadorNegrasDto);

    return new Partida({
      id: String(id),
      salaId: String(salaId),
      tablero,
      jugadorBlancas,
      jugadorNegras,
      turnoActual: turnoActual as Color,
      numeroTurnos: Number(numeroTurnos ?? 0),
      tiempoTranscurrido: Number(tiempoTranscurrido ?? 0),
      estado: estado as EstadoPartida,
      resultado: resultado as ResultadoPartida,
      tipoFin: tipoFin as TipoFinPartida | null,
      tablasBlancas: Boolean(tablasBlancas),
      tablasNegras: Boolean(tablasNegras),
      hayJaque: Boolean(hayJaque),
      hayJaqueMate: Boolean(hayJaqueMate),
    });
  }
}
