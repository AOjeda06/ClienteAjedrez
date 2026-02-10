/**
 * src/presentation/hooks/useViewModels.ts
 * Hooks para los ViewModels (correcciones)
 *
 * usePartida: se suscribe a PartidaIniciada y maneja la inicialización de la VM.
 */

import { useMemo, useEffect } from 'react';
import { MenuPrincipalVM } from '../viewmodels/MenuPrincipalVM';
import { IdentificacionVM } from '../viewmodels/IdentificacionVM';
import { PartidaVM } from '../viewmodels/PartidaVM';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { container } from '../../core/container';
import { Partida } from '../../domain/entities/Partida';
import { Color } from '../../core/types';

/**
 * Helper: safeBind - devuelve una función enlazada si existe, o un noop.
 */
const safeBind = (obj: any, fnName: string) => {
  if (!obj) return () => {};
  const fn = (obj as any)[fnName];
  return typeof fn === 'function' ? fn.bind(obj) : () => {};
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

    const onPartidaIniciada = (partida: Partida) => {
      console.log('[TRACE hook] PartidaIniciada recibida en hook:', { id: partida.id, salaId: partida.salaId });
      if (!mounted) {
        console.warn('[TRACE hook] componente desmontado, ignorando partida');
        return;
      }

      // Determinar color local de forma simple: si el nombre coincide con jugadorBlancas/negras
      // Intentamos obtener nombre local desde MenuPrincipalVM o IdentificacionVM si están registrados
      let miNombre: string | undefined;
      try {
        if ((container as any).isRegistered?.('MenuPrincipalVM')) {
          const menuVM = (container as any).resolve<MenuPrincipalVM>('MenuPrincipalVM');
          miNombre = (menuVM as any).nombreJugador ?? miNombre;
        }
        if (!miNombre && (container as any).isRegistered?.('IdentificacionVM')) {
          const idVM = (container as any).resolve<IdentificacionVM>('IdentificacionVM');
          miNombre = (idVM as any).nombre ?? miNombre;
        }
      } catch (err) {
        // noop
      }

      const determinarColor = (): Color => {
        try {
          const nb = partida.jugadorBlancas?.nombre ?? '';
          const nn = partida.jugadorNegras?.nombre ?? '';
          if (miNombre) {
            if (miNombre === nn) return 'Negra';
            if (miNombre === nb) return 'Blanca';
          }
          // fallback
          return 'Blanca';
        } catch (err) {
          return 'Blanca';
        }
      };

      const miColor = determinarColor();
      try {
        viewModel.inicializarPartida(partida, miColor);
        console.log('[TRACE hook] VM inicializada con partida:', { id: partida.id, miColor });
      } catch (err) {
        console.error('[ERROR hook] inicializarPartida falló:', err);
      }
    };

    // Registramos la suscripción en el useCase
    try {
      useCase.subscribePartidaIniciada(onPartidaIniciada);
      console.log('[TRACE hook] Suscrito a subscribePartidaIniciada en useCase');
    } catch (err) {
      console.error('[ERROR hook] Error suscribiendo a PartidaIniciada:', err);
    }

    return () => {
      mounted = false;
      try {
        useCase.unsubscribeAll();
      } catch (err) {
        // noop
      }
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
