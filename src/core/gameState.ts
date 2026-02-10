/**
 * src/core/gameState.ts
 *
 * Módulo singleton para almacenar la partida pendiente.
 *
 * PROBLEMA QUE RESUELVE (race condition):
 *   El evento PartidaIniciada llega mientras el usuario está en MenuPrincipal.
 *   MenuPrincipalVM lo recibe → navega a PartidaScreen.
 *   Cuando PartidaScreen monta y usePartida() se suscribe a PartidaIniciada,
 *   el evento ya disparó y el VM nunca se inicializa → tablero vacío.
 *
 * SOLUCIÓN:
 *   MenuPrincipalVM llama setPendingPartida() al recibir la partida.
 *   usePartida() lee getPendingPartida() en el useEffect de montaje y la
 *   usa para inicializar el VM inmediatamente, sin esperar otro evento.
 */

import { Partida } from '../domain/entities/Partida';

interface PendingPartida {
  partida: Partida;
  miNombre: string;
}

let _pending: PendingPartida | null = null;

/** Guarda la partida recibida para que PartidaScreen la use al montar. */
export const setPendingPartida = (partida: Partida, miNombre: string): void => {
  _pending = { partida, miNombre };
};

/** Devuelve la partida pendiente, o null si no hay ninguna. */
export const getPendingPartida = (): PendingPartida | null => _pending;

/** Limpia la partida pendiente (llamar después de usarla). */
export const clearPendingPartida = (): void => {
  _pending = null;
};