/**
 * Entidad Tablero
 * Gestiona el estado del tablero y la lógica de movimientos
 * Implementa la lógica completa de validación de movimientos de ajedrez
 */

import { ID, Color, Posicion, TABLERO_FILAS, TABLERO_COLUMNAS, esPosicionValida, posicionesIguales } from '../types';
import { Pieza } from './Pieza';
import { Movimiento } from './Movimiento';

export class Tablero {
  piezas: Pieza[];
  movimientos: Movimiento[];

  constructor(piezas: Pieza[] = [], movimientos: Movimiento[] = []) {
    this.piezas = piezas;
    this.movimientos = movimientos;
  }

  /**
   * Obtiene la pieza en una posición específica
   */
  obtenerPieza(posicion: Posicion): Pieza | null {
    return this.piezas.find(
      p => !p.eliminada && p.posicion.fila === posicion.fila && p.posicion.columna === posicion.columna
    ) || null;
  }

  /**
   * Obtiene todas las piezas vivas de un color
   */
  obtenerPiezasPorColor(color: Color): Pieza[] {
    return this.piezas.filter(p => p.color === color && !p.eliminada);
  }

  /**
   * Obtiene el rey de un color específico
   */
  obtenerRey(color: Color): Pieza | null {
    return this.piezas.find(p => p.color === color && p.tipo === 'Rey' && !p.eliminada) || null;
  }

  /**
   * Agrega una pieza al tablero
   */
  agregarPieza(pieza: Pieza): void {
    this.piezas.push(pieza);
  }

  /**
   * Remueve una pieza del tablero
   */
  removerPieza(piezaId: ID): void {
    const pieza = this.piezas.find(p => p.id === piezaId);
    if (pieza) {
      pieza.eliminar();
    }
  }

  /**
   * Registra un movimiento en el historial
   */
  registrarMovimiento(movimiento: Movimiento): void {
    this.movimientos.push(movimiento);
  }

  /**
   * Obtiene el último movimiento realizado
   */
  obtenerUltimoMovimiento(): Movimiento | null {
    return this.movimientos.length > 0 ? this.movimientos[this.movimientos.length - 1] : null;
  }

  /**
   * Calcula los movimientos posibles para una pieza (sin considerar jaque)
   * Este es el método central de validación de movimientos legales
   */
  obtenerMovimientosPosibles(pieza: Pieza): Posicion[] {
    const movimientos: Posicion[] = [];

    switch (pieza.tipo) {
      case 'Peon':
        this.calcularMovimientosPeon(pieza, movimientos);
        break;
      case 'Torre':
        this.calcularMovimientosTorre(pieza, movimientos);
        break;
      case 'Caballo':
        this.calcularMovimientosCaballo(pieza, movimientos);
        break;
      case 'Alfil':
        this.calcularMovimientosAlfil(pieza, movimientos);
        break;
      case 'Reina':
        this.calcularMovimientosReina(pieza, movimientos);
        break;
      case 'Rey':
        this.calcularMovimientosRey(pieza, movimientos);
        break;
    }

    // Filtra movimientos que dejarían al rey en jaque
    return movimientos.filter(destino => !this.movimientoDejaEnJaque(pieza, destino));
  }

  /**
   * Calcula movimientos posibles para un peón
   * Incluye: avance de 1-2 casillas (inicio), captura diagonal, captura al paso
   */
  private calcularMovimientosPeon(pieza: Pieza, movimientos: Posicion[]): void {
    const direccion = pieza.color === 'Blanca' ? -1 : 1;
    const filaPrimerMovimiento = pieza.color === 'Blanca' ? 6 : 1;

    // Avance de una casilla
    const pos1 = { fila: pieza.posicion.fila + direccion, columna: pieza.posicion.columna };
    if (esPosicionValida(pos1) && !this.obtenerPieza(pos1)) {
      movimientos.push(pos1);

      // Avance de dos casillas (solo en primer movimiento)
      if (pieza.posicion.fila === filaPrimerMovimiento) {
        const pos2 = { fila: pieza.posicion.fila + 2 * direccion, columna: pieza.posicion.columna };
        if (!this.obtenerPieza(pos2)) {
          movimientos.push(pos2);
        }
      }
    }

    // Capturas diagonales
    for (let offset of [-1, 1]) {
      const posCaptura = {
        fila: pieza.posicion.fila + direccion,
        columna: pieza.posicion.columna + offset,
      };
      if (esPosicionValida(posCaptura)) {
        const piezaCaptura = this.obtenerPieza(posCaptura);
        if (piezaCaptura && piezaCaptura.color !== pieza.color) {
          movimientos.push(posCaptura);
        }
      }
    }

    // Captura al paso (en passant)
    this.agregarCapturasAlPaso(pieza, movimientos, direccion);
  }

  /**
   * Maneja la lógica de captura al paso
   */
  private agregarCapturasAlPaso(pieza: Pieza, movimientos: Posicion[], direccion: number): void {
    if (pieza.tipo !== 'Peon') return;

    const ultimoMovimiento = this.obtenerUltimoMovimiento();
    if (!ultimoMovimiento) return;

    // El último movimiento debe ser un peón que se movió 2 casillas
    const piezaMovida = this.piezas.find(p => p.id === ultimoMovimiento.piezaId);
    if (!piezaMovida || piezaMovida.tipo !== 'Peon') return;

    const distancia = Math.abs(ultimoMovimiento.destino.fila - ultimoMovimiento.origen.fila);
    if (distancia !== 2) return;

    // El peón enemigo debe estar al lado
    if (piezaMovida.posicion.fila === pieza.posicion.fila &&
        Math.abs(piezaMovida.posicion.columna - pieza.posicion.columna) === 1) {
      const posAlPaso = {
        fila: pieza.posicion.fila + direccion,
        columna: piezaMovida.posicion.columna,
      };
      if (esPosicionValida(posAlPaso)) {
        movimientos.push(posAlPaso);
      }
    }
  }

  /**
   * Calcula movimientos posibles para una torre (movimiento lineal horizontal/vertical)
   */
  private calcularMovimientosTorre(pieza: Pieza, movimientos: Posicion[]): void {
    const direcciones = [
      { fila: -1, columna: 0 }, // arriba
      { fila: 1, columna: 0 },  // abajo
      { fila: 0, columna: -1 }, // izquierda
      { fila: 0, columna: 1 },  // derecha
    ];

    for (const dir of direcciones) {
      this.agregarMovimientosEnLinea(pieza, dir, movimientos);
    }
  }

  /**
   * Calcula movimientos posibles para un alfil (movimiento diagonal)
   */
  private calcularMovimientosAlfil(pieza: Pieza, movimientos: Posicion[]): void {
    const direcciones = [
      { fila: -1, columna: -1 }, // arriba-izquierda
      { fila: -1, columna: 1 },  // arriba-derecha
      { fila: 1, columna: -1 },  // abajo-izquierda
      { fila: 1, columna: 1 },   // abajo-derecha
    ];

    for (const dir of direcciones) {
      this.agregarMovimientosEnLinea(pieza, dir, movimientos);
    }
  }

  /**
   * Calcula movimientos posibles para una reina (combinación de torre y alfil)
   */
  private calcularMovimientosReina(pieza: Pieza, movimientos: Posicion[]): void {
    const direcciones = [
      // Horizontales/Verticales
      { fila: -1, columna: 0 }, { fila: 1, columna: 0 },
      { fila: 0, columna: -1 }, { fila: 0, columna: 1 },
      // Diagonales
      { fila: -1, columna: -1 }, { fila: -1, columna: 1 },
      { fila: 1, columna: -1 }, { fila: 1, columna: 1 },
    ];

    for (const dir of direcciones) {
      this.agregarMovimientosEnLinea(pieza, dir, movimientos);
    }
  }

  /**
   * Agrega movimientos en una línea hasta encontrar un obstáculo
   * Utilizado por Torre, Alfil y Reina
   */
  private agregarMovimientosEnLinea(
    pieza: Pieza,
    direccion: { fila: number; columna: number },
    movimientos: Posicion[]
  ): void {
    let posActual = {
      fila: pieza.posicion.fila + direccion.fila,
      columna: pieza.posicion.columna + direccion.columna,
    };

    while (esPosicionValida(posActual)) {
      const piezaEnCasilla = this.obtenerPieza(posActual);

      if (!piezaEnCasilla) {
        // Casilla vacía, el movimiento es posible
        movimientos.push({ ...posActual });
      } else {
        // Hay una pieza
        if (piezaEnCasilla.color !== pieza.color) {
          // Es de color opuesto, puede capturarse
          movimientos.push({ ...posActual });
        }
        // En cualquier caso, se detiene la búsqueda
        break;
      }

      posActual = {
        fila: posActual.fila + direccion.fila,
        columna: posActual.columna + direccion.columna,
      };
    }
  }

  /**
   * Calcula movimientos posibles para un caballo (movimiento en L)
   */
  private calcularMovimientosCaballo(pieza: Pieza, movimientos: Posicion[]): void {
    const desplazamientos = [
      { fila: -2, columna: -1 }, { fila: -2, columna: 1 },
      { fila: -1, columna: -2 }, { fila: -1, columna: 2 },
      { fila: 1, columna: -2 }, { fila: 1, columna: 2 },
      { fila: 2, columna: -1 }, { fila: 2, columna: 1 },
    ];

    for (const despl of desplazamientos) {
      const posDestino = {
        fila: pieza.posicion.fila + despl.fila,
        columna: pieza.posicion.columna + despl.columna,
      };

      if (esPosicionValida(posDestino)) {
        const piezaDestino = this.obtenerPieza(posDestino);
        if (!piezaDestino || piezaDestino.color !== pieza.color) {
          movimientos.push(posDestino);
        }
      }
    }
  }

  /**
   * Calcula movimientos posibles para el rey (una casilla en cualquier dirección + enroque)
   */
  private calcularMovimientosRey(pieza: Pieza, movimientos: Posicion[]): void {
    const desplazamientos = [
      { fila: -1, columna: -1 }, { fila: -1, columna: 0 }, { fila: -1, columna: 1 },
      { fila: 0, columna: -1 }, { fila: 0, columna: 1 },
      { fila: 1, columna: -1 }, { fila: 1, columna: 0 }, { fila: 1, columna: 1 },
    ];

    for (const despl of desplazamientos) {
      const posDestino = {
        fila: pieza.posicion.fila + despl.fila,
        columna: pieza.posicion.columna + despl.columna,
      };

      if (esPosicionValida(posDestino)) {
        const piezaDestino = this.obtenerPieza(posDestino);
        if (!piezaDestino || piezaDestino.color !== pieza.color) {
          movimientos.push(posDestino);
        }
      }
    }

    // Enroque
    this.agregarMovimientosEnroque(pieza, movimientos);
  }

  /**
   * Agrega movimientos de enroque si son válidos
   * Valida: rey y torre no han movido, casillas intermedias están vacías,
   * el rey no está en jaque ni pasa por jaque
   */
  private agregarMovimientosEnroque(pieza: Pieza, movimientos: Posicion[]): void {
    if (pieza.tipo !== 'Rey' || !pieza.nunca_ha_movido) return;
    if (this.hayJaque(pieza.color)) return;

    const filaRey = pieza.posicion.fila;

    // Enroque corto (lado del rey)
    this.intentarEnroqueLado(pieza, filaRey, 7, movimientos, 'corto');

    // Enroque largo (lado de la reina)
    this.intentarEnroqueLado(pieza, filaRey, 0, movimientos, 'largo');
  }

  /**
   * Intenta validar un enroque en un lado específico
   */
  private intentarEnroqueLado(
    rey: Pieza,
    filaRey: number,
    columnaRey: number,
    movimientos: Posicion[],
    tipo: 'corto' | 'largo'
  ): void {
    // Obtiene la torre
    const torre = this.obtenerPieza({ fila: filaRey, columna: columnaRey });
    if (!torre || torre.tipo !== 'Torre' || !torre.nunca_ha_movido) return;

    // Verifica que las casillas intermedias estén vacías
    const inicio = Math.min(rey.posicion.columna, columnaRey);
    const fin = Math.max(rey.posicion.columna, columnaRey);

    for (let col = inicio + 1; col < fin; col++) {
      if (this.obtenerPieza({ fila: filaRey, columna: col })) {
        return; // Hay una pieza en el camino
      }
    }

    // Para enroque largo, verifica también la casilla más alejada
    if (tipo === 'largo' && this.obtenerPieza({ fila: filaRey, columna: 1 })) {
      return;
    }

    // Verifica que el rey no pase por jaque
    const columnaIntermedia = tipo === 'corto' ? 6 : 2;
    if (this.estaCasillaAtacada({ fila: filaRey, columna: columnaIntermedia }, rey.color)) {
      return;
    }

    // Agrega el movimiento de enroque
    const posDestino = tipo === 'corto'
      ? { fila: filaRey, columna: 6 }
      : { fila: filaRey, columna: 2 };

    movimientos.push(posDestino);
  }

  /**
   * Verifica si un movimiento dejaría al rey en jaque
   */
  private movimientoDejaEnJaque(pieza: Pieza, destino: Posicion): boolean {
    // Simula el movimiento
    const posicionOriginal = pieza.posicion;
    const piezaCapturada = this.obtenerPieza(destino);

    pieza.mover(destino);
    if (piezaCapturada) {
      piezaCapturada.eliminar();
    }

    // Verifica jaque
    const hayJaque = this.hayJaque(pieza.color);

    // Deshace el movimiento
    pieza.mover(posicionOriginal);
    if (piezaCapturada) {
      piezaCapturada.eliminada = false;
    }

    return hayJaque;
  }

  /**
   * Verifica si hay jaque para un color (el rey está siendo atacado)
   */
  hayJaque(color: Color): boolean {
    const rey = this.obtenerRey(color);
    if (!rey) return false;

    return this.estaCasillaAtacada(rey.posicion, color);
  }

  /**
   * Verifica si una casilla está siendo atacada por el color opuesto
   */
  private estaCasillaAtacada(casilla: Posicion, colorDefensor: Color): boolean {
    const colorAtacante = colorDefensor === 'Blanca' ? 'Negra' : 'Blanca';
    const piezasAtacantes = this.obtenerPiezasPorColor(colorAtacante);

    for (const pieza of piezasAtacantes) {
      if (this.puedePiezaAtacarCasilla(pieza, casilla)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si una pieza puede atacar una casilla específica
   * Se diferencia de obtenerMovimientosPosibles porque no filtra por jaque
   */
  private puedePiezaAtacarCasilla(pieza: Pieza, casilla: Posicion): boolean {
    const movimientos: Posicion[] = [];

    switch (pieza.tipo) {
      case 'Peon':
        this.calcularAtaquesPeon(pieza, movimientos);
        break;
      case 'Torre':
        this.calcularMovimientosTorre(pieza, movimientos);
        break;
      case 'Caballo':
        this.calcularMovimientosCaballo(pieza, movimientos);
        break;
      case 'Alfil':
        this.calcularMovimientosAlfil(pieza, movimientos);
        break;
      case 'Reina':
        this.calcularMovimientosReina(pieza, movimientos);
        break;
      case 'Rey':
        this.calcularAtaquesRey(pieza, movimientos);
        break;
    }

    return movimientos.some(m => posicionesIguales(m, casilla));
  }

  /**
   * Calcula los cuadrados que un peón puede atacar (solo diagonales)
   */
  private calcularAtaquesPeon(pieza: Pieza, movimientos: Posicion[]): void {
    const direccion = pieza.color === 'Blanca' ? -1 : 1;

    for (let offset of [-1, 1]) {
      const posAtaque = {
        fila: pieza.posicion.fila + direccion,
        columna: pieza.posicion.columna + offset,
      };
      if (esPosicionValida(posAtaque)) {
        movimientos.push(posAtaque);
      }
    }
  }

  /**
   * Calcula los cuadrados que el rey puede atacar
   */
  private calcularAtaquesRey(pieza: Pieza, movimientos: Posicion[]): void {
    const desplazamientos = [
      { fila: -1, columna: -1 }, { fila: -1, columna: 0 }, { fila: -1, columna: 1 },
      { fila: 0, columna: -1 }, { fila: 0, columna: 1 },
      { fila: 1, columna: -1 }, { fila: 1, columna: 0 }, { fila: 1, columna: 1 },
    ];

    for (const despl of desplazamientos) {
      const posDestino = {
        fila: pieza.posicion.fila + despl.fila,
        columna: pieza.posicion.columna + despl.columna,
      };

      if (esPosicionValida(posDestino)) {
        movimientos.push(posDestino);
      }
    }
  }

  /**
   * Verifica si hay jaque mate para un color
   * Condiciones: hay jaque Y no hay movimientos legales disponibles
   */
  hayJaqueMate(color: Color): boolean {
    if (!this.hayJaque(color)) return false;

    // Verifica si hay al menos un movimiento legal disponible
    const piezas = this.obtenerPiezasPorColor(color);
    for (const pieza of piezas) {
      const movimientosPosibles = this.obtenerMovimientosPosibles(pieza);
      if (movimientosPosibles.length > 0) {
        return false; // Hay al menos un movimiento legal
      }
    }

    return true; // Hay jaque y no hay movimientos legales
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      piezas: this.piezas.map(p => p.toPlain()),
      movimientos: this.movimientos.map(m => m.toPlain()),
    };
  }

  /**
   * Crea una instancia desde un DTO
   */
  static createFromDTO(dto: {
    piezas?: any[];
    movimientos?: any[];
  }): Tablero {
    const piezas = (dto.piezas || []).map(p => Pieza.createFromDTO(p));
    const movimientos = (dto.movimientos || []).map(m => Movimiento.createFromDTO(m));
    return new Tablero(piezas, movimientos);
  }

  /**
   * Inicializa un tablero con la posición inicial de ajedrez
   */
  static crearTableroInicial(): Tablero {
    const piezas: Pieza[] = [];
    let id = 1;

    const crearPieza = (tipo: any, color: Color, fila: number, columna: number) => {
      piezas.push(
        new Pieza({
          id: `${id++}`,
          tipo,
          color,
          posicion: { fila, columna },
        })
      );
    };

    // Peones blancos
    for (let col = 0; col < 8; col++) {
      crearPieza('Peon', 'Blanca', 6, col);
    }

    // Peones negros
    for (let col = 0; col < 8; col++) {
      crearPieza('Peon', 'Negra', 1, col);
    }

    // Filas 0 y 7: Torres, Caballos, Alfiles, Reina, Rey
    const ordenPiezas: TipoPieza[] = ['Torre', 'Caballo', 'Alfil', 'Reina', 'Rey', 'Alfil', 'Caballo', 'Torre'];

    for (let col = 0; col < 8; col++) {
      crearPieza(ordenPiezas[col], 'Negra', 0, col);
      crearPieza(ordenPiezas[col], 'Blanca', 7, col);
    }

    return new Tablero(piezas);
  }
}

type TipoPieza = 'Peon' | 'Torre' | 'Caballo' | 'Alfil' | 'Reina' | 'Rey';
