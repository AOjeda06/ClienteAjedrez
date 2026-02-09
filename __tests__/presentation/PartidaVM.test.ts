/**
 * Tests para PartidaVM
 */

import { PartidaVM } from '../../src/presentation/viewmodels/PartidaVM';
import { Partida } from '../../src/domain/entities/Partida';
import { Tablero } from '../../src/domain/entities/Tablero';
import { Jugador } from '../../src/domain/entities/Jugador';

// Mock simple del UseCase
class MockAjedrezUseCase {
  subscriptions: Map<string, Function[]> = new Map();

  subscribeMovimiento(callback: any) {
    if (!this.subscriptions.has('movimiento')) {
      this.subscriptions.set('movimiento', []);
    }
    this.subscriptions.get('movimiento')!.push(callback);
  }

  subscribeTurno(callback: any) {
    if (!this.subscriptions.has('turno')) {
      this.subscriptions.set('turno', []);
    }
    this.subscriptions.get('turno')!.push(callback);
  }

  subscribeJaque(callback: any) {
    if (!this.subscriptions.has('jaque')) {
      this.subscriptions.set('jaque', []);
    }
    this.subscriptions.get('jaque')!.push(callback);
  }

  subscribeFinPartida(callback: any) {
    if (!this.subscriptions.has('finPartida')) {
      this.subscriptions.set('finPartida', []);
    }
    this.subscriptions.get('finPartida')!.push(callback);
  }

  subscribePromocion(callback: any) {}
  subscribeTablas(callback: any) {}
  subscribeReinicio(callback: any) {}
  subscribeError(callback: any) {}

  async moverPieza() {}
  async deshacerJugada() {}
  async pedirTablas() {}
  async cancelarTablas() {}
  async rendirsePartida() {}
  async seleccionarPromocion() {}
  async pedirReinicio() {}
  async cancelarReinicio() {}

  unsubscribeAll() {
    this.subscriptions.clear();
  }
}

describe('PartidaVM', () => {
  let vm: PartidaVM;
  let mockUseCase: MockAjedrezUseCase;

  beforeEach(() => {
    mockUseCase = new MockAjedrezUseCase();
    vm = new PartidaVM(mockUseCase as any);
  });

  describe('Inicialización', () => {
    test('debe inicializar correctamente con una partida', () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');

      expect(vm.partida).toBe(partida);
      expect(vm.miColor).toBe('Blanca');
      expect(vm.nombreOponente).toBe('Jugador2');
      expect(vm.tablero).not.toBeNull();
    });
  });

  describe('Seleccionar casilla', () => {
    test('debe seleccionar una pieza propia', () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');

      // Seleccionar un peón blanco
      vm.seleccionarCasilla({ fila: 6, columna: 0 });

      expect(vm.piezaSeleccionada).not.toBeNull();
      expect(vm.piezaSeleccionada?.tipo).toBe('Peon');
      expect(vm.movimientosPosibles.length).toBeGreaterThan(0);
    });

    test('no debe permitir seleccionar pieza del oponente', () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');

      // Intentar seleccionar una pieza negra
      vm.seleccionarCasilla({ fila: 0, columna: 0 });

      expect(vm.piezaSeleccionada).toBeNull();
      expect(vm.movimientosPosibles.length).toBe(0);
    });
  });

  describe('Tablas', () => {
    test('debe ofrecer tablas', async () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');
      await vm.solicitarTablas();

      expect(vm.solicitadasTablas).toBe(true);
    });
  });

  describe('Rendición', () => {
    test('debe permitir rendirse', async () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');
      await vm.rendirse();

      expect(mockUseCase.subscriptions.get('rendirse')).toBeDefined();
    });
  });

  describe('Reset', () => {
    test('debe limpiar el estado', () => {
      const tablero = Tablero.crearTableroInicial();
      const jugador1 = new Jugador('1', 'Jugador1', 'Blanca');
      const jugador2 = new Jugador('2', 'Jugador2', 'Negra');
      const partida = new Partida({
        id: 'partida-1',
        salaId: 'sala-1',
        tablero,
        jugadorBlancas: jugador1,
        jugadorNegras: jugador2,
      });

      vm.inicializarPartida(partida, 'Blanca');
      vm.reset();

      expect(vm.partida).toBeNull();
      expect(vm.miColor).toBeNull();
      expect(vm.piezaSeleccionada).toBeNull();
      expect(vm.movimientosPosibles.length).toBe(0);
    });
  });
});
