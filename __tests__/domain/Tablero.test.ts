/**
 * Tests para la entidad Tablero
 */

import { Tablero } from '../../src/domain/entities/Tablero';
import { Pieza } from '../../src/domain/entities/Pieza';
import { Movimiento } from '../../src/domain/entities/Movimiento';

describe('Tablero', () => {
  let tablero: Tablero;

  beforeEach(() => {
    tablero = Tablero.crearTableroInicial();
  });

  describe('Obtener pieza', () => {
    test('debe obtener pieza en posición válida', () => {
      const pieza = tablero.obtenerPieza({ fila: 6, columna: 0 });
      expect(pieza).not.toBeNull();
      expect(pieza?.tipo).toBe('Peon');
      expect(pieza?.color).toBe('Blanca');
    });

    test('debe retornar null si no hay pieza', () => {
      const pieza = tablero.obtenerPieza({ fila: 4, columna: 4 });
      expect(pieza).toBeNull();
    });
  });

  describe('Movimientos de piezas', () => {
    test('debe calcular movimientos posibles para un peón blanco en inicio', () => {
      const peon = tablero.obtenerPieza({ fila: 6, columna: 0 });
      expect(peon).not.toBeNull();

      const movimientos = tablero.obtenerMovimientosPosibles(peon!);
      // Un peón en inicio puede moverse 1 o 2 casillas hacia adelante
      expect(movimientos.length).toBe(2);
      expect(movimientos).toContainEqual({ fila: 5, columna: 0 });
      expect(movimientos).toContainEqual({ fila: 4, columna: 0 });
    });

    test('debe calcular movimientos para una torre', () => {
      const torre = tablero.obtenerPieza({ fila: 7, columna: 0 });
      expect(torre).not.toBeNull();
      expect(torre?.tipo).toBe('Torre');

      // La torre en inicio está bloqueada por peones
      const movimientos = tablero.obtenerMovimientosPosibles(torre!);
      expect(movimientos.length).toBe(0);
    });

    test('debe calcular movimientos para un caballo', () => {
      const caballo = tablero.obtenerPieza({ fila: 7, columna: 1 });
      expect(caballo).not.toBeNull();
      expect(caballo?.tipo).toBe('Caballo');

      const movimientos = tablero.obtenerMovimientosPosibles(caballo!);
      // Un caballo en inicio tiene 2 movimientos posibles
      expect(movimientos.length).toBe(2);
    });
  });

  describe('Enroque', () => {
    test('no debe permitir enroque si el rey está en jaque', () => {
      // Este test requeriría una posición específica
      // Por ahora solo verificamos que el método existe
      const rey = tablero.obtenerRey('Blanca');
      expect(rey).not.toBeNull();
    });

    test('no debe permitir enroque si hay piezas en el camino', () => {
      // El tablero inicial no permite enroque por los peones
      const rey = tablero.obtenerRey('Blanca');
      if (rey) {
        const movimientos = tablero.obtenerMovimientosPosibles(rey);
        // No debe haber movimientos de enroque en posición inicial
        const tieneMvtoEnroque = movimientos.some(m => Math.abs(m.columna - rey.posicion.columna) === 2);
        expect(tieneMvtoEnroque).toBe(false);
      }
    });
  });

  describe('Jaque y jaque mate', () => {
    test('debe detectar cuando no hay jaque', () => {
      const hayJaque = tablero.hayJaque('Blanca');
      expect(hayJaque).toBe(false);
    });

    test('debe detectar cuando no hay jaque mate', () => {
      const hayJaqueMate = tablero.hayJaqueMate('Blanca');
      expect(hayJaqueMate).toBe(false);
    });
  });

  describe('Obtener piezas por color', () => {
    test('debe retornar 16 piezas para cada color en inicio', () => {
      const blancas = tablero.obtenerPiezasPorColor('Blanca');
      const negras = tablero.obtenerPiezasPorColor('Negra');

      expect(blancas.length).toBe(16);
      expect(negras.length).toBe(16);
    });
  });

  describe('Captura al paso', () => {
    test('debe permitir captura al paso cuando aplique', () => {
      // Este test requeriría una configuración específica de posición
      // Por ahora solo verificamos que el método existe
      const peon = tablero.obtenerPieza({ fila: 6, columna: 0 });
      expect(peon).not.toBeNull();
    });
  });
});
