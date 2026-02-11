/**
 * src/presentation/hooks/useViewModels.ts
 * Hooks para los ViewModels
 *
 * CORRECCIONES:
 *  - usePartida: lee getPendingPartida() al montar → soluciona la race condition
 *  - Pasa miNombre al inicializar PartidaVM (fix: nombre/miColor mal asignados)
 *  - Cleanup: ya NO llama unsubscribeAll() al desmontar para no matar las suscripciones
 */

import { useEffect, useMemo } from 'react';
import { container } from '../../core/container';
import { clearPendingPartida, getPendingPartida } from '../../core/gameState';
import { Color } from '../../core/types';
import { Partida } from '../../domain/entities/Partida';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { IdentificacionVM } from '../viewmodels/IdentificacionVM';
import { MenuPrincipalVM } from '../viewmodels/MenuPrincipalVM';
import { PartidaVM } from '../viewmodels/PartidaVM';

/**
 * Helper: safeBind - devuelve una función enlazada si existe, o un noop.
 */
const safeBind = (obj: any, fnName: string) => {
  if (!obj) {
    console.warn(`[safeBind] ${fnName}: obj es null/undefined`);
    return () => {};
  }
  const fn = (obj as any)[fnName];
  if (typeof fn === 'function') {
    return fn.bind(obj);
  } else {
    console.error(`[safeBind] ${fnName}: NO es una función! tipo:`, typeof fn);
    return () => {};
  }
};

/**
 * Determina el color (Blanca/Negra) del jugador local comparando el nombre
 * con los de la partida recibida del servidor.
 */
const determinarColorLocal = (partida: Partida, miNombre: string): Color => {
  try {
    const nb = partida.jugadorBlancas?.nombre ?? '';
    const nn = partida.jugadorNegras?.nombre ?? '';

    console.log('[TRACE determinarColorLocal] Comparando nombres:', {
      miNombre,
      jugadorBlancas: nb,
      jugadorNegras: nn
    });

    // Normalizar nombres (trim y toLowerCase para comparación insensible a mayúsculas/espacios)
    const miNombreNorm = miNombre?.trim().toLowerCase() ?? '';
    const nbNorm = nb?.trim().toLowerCase() ?? '';
    const nnNorm = nn?.trim().toLowerCase() ?? '';

    if (miNombreNorm && nnNorm && miNombreNorm === nnNorm) {
      console.log('[TRACE determinarColorLocal] Jugador es NEGRAS');
      return 'Negra';
    }
    if (miNombreNorm && nbNorm && miNombreNorm === nbNorm) {
      console.log('[TRACE determinarColorLocal] Jugador es BLANCAS');
      return 'Blanca';
    }

    // Si no hay coincidencia exacta
    console.warn('[WARN determinarColorLocal] No se encontró coincidencia exacta de nombres, usando fallback');
    return 'Blanca'; // fallback
  } catch (err) {
    console.error('[ERROR determinarColorLocal]', err);
    return 'Blanca';
  }
};

export const useIdentificacion = () => {
  const viewModel = useMemo(() => new IdentificacionVM(), []);
  return {
    viewModel,
    actions: {
      setNombre: safeBind(viewModel, 'setNombre'),
      validarYContinuar: safeBind(viewModel, 'validarYContinuar'),
      setLoading: safeBind(viewModel, 'setLoading'),
      reset: safeBind(viewModel, 'reset'),
    },
  };
};

export const useMenuPrincipal = () => {
  const useCase = container.resolve<IAjedrezUseCase>('AjedrezUseCase');
  const viewModel = useMemo(() => new MenuPrincipalVM(useCase), [useCase]);

  return {
    viewModel,
    actions: {
      setNombreJugador: safeBind(viewModel, 'setNombreJugador'),
      setNombreSalaCrear: safeBind(viewModel, 'setNombreSalaCrear'),
      setNombreSalaUnirse: safeBind(viewModel, 'setNombreSalaUnirse'),
      conectar: safeBind(viewModel, 'conectar'),
      desconectar: safeBind(viewModel, 'desconectar'),
      crearSala: safeBind(viewModel, 'crearSala'),
      unirseSala: safeBind(viewModel, 'unirseSala'),
      reset: safeBind(viewModel, 'reset'),
    },
  };
};

export const usePartida = () => {
  const useCase = container.resolve<IAjedrezUseCase>('AjedrezUseCase');
  const viewModel = useMemo(() => new PartidaVM(useCase), [useCase]);

  useEffect(() => {
    let mounted = true;

    // ── FIX PRINCIPAL: comprobar si la partida ya llegó antes de que este
    //    componente montase (race condition). MenuPrincipalVM la guardó via
    //    setPendingPartida() en gameState.ts justo al recibirla.
    const pending = getPendingPartida();
    if (pending) {
      clearPendingPartida();
      const miColor = determinarColorLocal(pending.partida, pending.miNombre);
      try {
        // ← CORRECCIÓN: pasar también miNombre al inicializar la VM
        viewModel.inicializarPartida(pending.partida, miColor, pending.miNombre);
        console.log('[TRACE hook] VM inicializada desde pendingPartida:', {
          id: pending.partida.id,
          miColor,
          miNombre: pending.miNombre,
        });
      } catch (err) {
        console.error('[ERROR hook] inicializarPartida (pending) falló:', err);
      }
      // Con la partida ya inicializada no es necesario suscribirse al evento.
      return;
    }

    // ── FALLBACK: la partida aún no llegó (caso poco probable, p.ej. navegación
    //    manual a la pantalla). Nos suscribimos por si acaso.
    console.log('[TRACE hook] No hay pendingPartida, suscribiendo a subscribePartidaIniciada...');

    const onPartidaIniciada = (partida: Partida) => {
      console.log('[TRACE hook] PartidaIniciada recibida en hook:', { id: partida.id });
      if (!mounted) {
        console.warn('[TRACE hook] componente desmontado, ignorando partida');
        return;
      }

      // Intentar obtener nombre local desde container
      let miNombre = '';
      try {
        if ((container as any).isRegistered?.('MenuPrincipalVM')) {
          const menuVM = (container as any).resolve<MenuPrincipalVM>('MenuPrincipalVM');
          miNombre = (menuVM as any).nombreJugador ?? '';
        }
      } catch {
        // noop
      }

      const miColor = determinarColorLocal(partida, miNombre);
      try {
        // ← CORRECCIÓN: pasar miNombre al inicializar la VM
        viewModel.inicializarPartida(partida, miColor, miNombre);
        console.log('[TRACE hook] VM inicializada (fallback):', { id: partida.id, miColor, miNombre });
      } catch (err) {
        console.error('[ERROR hook] inicializarPartida (fallback) falló:', err);
      }
    };

    try {
      useCase.subscribePartidaIniciada(onPartidaIniciada);
    } catch (err) {
      console.error('[ERROR hook] Error suscribiendo a PartidaIniciada:', err);
    }

    return () => {
      mounted = false;
      // ── FIX: NO llamar unsubscribeAll() aquí porque mataría todas las
      //    suscripciones de SignalR necesarias durante la partida (movimientos,
      //    turno, jaque, etc.). El VM se desuscribe en volverAlMenu() cuando
      //    el usuario realmente quiere salir.
    };
  }, [useCase, viewModel]);

  return {
    state: viewModel,
    actions: {
      inicializarPartida: safeBind(viewModel, 'inicializarPartida'),
      seleccionarCasilla: safeBind(viewModel, 'seleccionarCasilla'),
      confirmarMovimiento: safeBind(viewModel, 'confirmarMovimiento'),
      deshacerMovimiento: safeBind(viewModel, 'deshacerMovimiento'),
      solicitarTablas: safeBind(viewModel, 'solicitarTablas'),
      retirarTablas: safeBind(viewModel, 'retirarTablas'),
      rendirse: safeBind(viewModel, 'rendirse'),
      promocionarPeon: safeBind(viewModel, 'promocionarPeon'),
      solicitarReinicio: safeBind(viewModel, 'solicitarReinicio'),
      retirarReinicio: safeBind(viewModel, 'retirarReinicio'),
      volverAlMenu: safeBind(viewModel, 'volverAlMenu'),
    },
  };
};
