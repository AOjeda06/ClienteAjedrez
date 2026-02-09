/**
 * Hooks para los ViewModels
 */

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { IdentificacionVM } from '../viewmodels/IdentificacionVM';
import { MenuPrincipalVM } from '../viewmodels/MenuPrincipalVM';
import { PartidaVM } from '../viewmodels/PartidaVM';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { container } from '../../core/container';

export const useIdentificacion = () => {
  const viewModel = useMemo(() => new IdentificacionVM(), []);

  return {
    state: {
      nombreJugador: viewModel.nombreJugador,
      error: viewModel.error,
      isLoading: viewModel.isLoading,
    },
    actions: {
      setNombre: viewModel.setNombre.bind(viewModel),
      validarYContinuar: viewModel.validarYContinuar.bind(viewModel),
      setLoading: viewModel.setLoading.bind(viewModel),
      reset: viewModel.reset.bind(viewModel),
    },
    viewModel,
  };
};

export const useMenuPrincipal = () => {
  const useCase = container.resolve<IAjedrezUseCase>('AjedrezUseCase');
  const viewModel = useMemo(() => new MenuPrincipalVM(useCase), [useCase]);

  return {
    state: {
      nombreJugador: viewModel.nombreJugador,
      nombreSala: viewModel.nombreSala,
      error: viewModel.error,
      isLoading: viewModel.isLoading,
      connectionState: viewModel.connectionState,
      salaCreada: viewModel.salaCreada,
      esperandoOponente: viewModel.esperandoOponente,
      partida: viewModel.partida,
    },
    actions: {
      setNombreJugador: viewModel.setNombreJugador.bind(viewModel),
      setNombreSala: viewModel.setNombreSala.bind(viewModel),
      conectar: viewModel.conectar.bind(viewModel),
      desconectar: viewModel.desconectar.bind(viewModel),
      crearSala: viewModel.crearSala.bind(viewModel),
      unirseSala: viewModel.unirseSala.bind(viewModel),
      reset: viewModel.reset.bind(viewModel),
    },
    viewModel,
  };
};

export const usePartida = () => {
  const useCase = container.resolve<IAjedrezUseCase>('AjedrezUseCase');
  const viewModel = useMemo(() => new PartidaVM(useCase), [useCase]);

  return {
    state: {
      partida: viewModel.partida,
      tablero: viewModel.tablero,
      miColor: viewModel.miColor,
      nombreOponente: viewModel.nombreOponente,
      piezaSeleccionada: viewModel.piezaSeleccionada,
      movimientosPosibles: viewModel.movimientosPosibles,
      mostrarPromocion: viewModel.mostrarPromocion,
      mostrarFinPartida: viewModel.mostrarFinPartida,
      mensajeTurno: viewModel.mensajeTurno,
      mensajeJaque: viewModel.mensajeJaque,
      piezasEliminadasBlancas: viewModel.piezasEliminadasBlancas,
      piezasEliminadasNegras: viewModel.piezasEliminadasNegras,
      error: viewModel.error,
      tablasOfrecidas: viewModel.tablasOfrecidas,
      solicitadasTablas: viewModel.solicitadasTablas,
      solicitadoReinicio: viewModel.solicitadoReinicio,
      oponenteSolicitoReinicio: viewModel.oponenteSolicitoReinicio,
    },
    actions: {
      inicializarPartida: viewModel.inicializarPartida.bind(viewModel),
      seleccionarCasilla: viewModel.seleccionarCasilla.bind(viewModel),
      confirmarMovimiento: viewModel.confirmarMovimiento.bind(viewModel),
      deshacerMovimiento: viewModel.deshacerMovimiento.bind(viewModel),
      solicitarTablas: viewModel.solicitarTablas.bind(viewModel),
      retirarTablas: viewModel.retirarTablas.bind(viewModel),
      rendirse: viewModel.rendirse.bind(viewModel),
      promocionarPeon: viewModel.promocionarPeon.bind(viewModel),
      solicitarReinicio: viewModel.solicitarReinicio.bind(viewModel),
      retirarReinicio: viewModel.retirarReinicio.bind(viewModel),
      volverAlMenu: viewModel.volverAlMenu.bind(viewModel),
    },
    viewModel,
  };
};
