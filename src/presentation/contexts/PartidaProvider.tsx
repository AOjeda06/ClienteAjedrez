// src/presentation/contexts/PartidaProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PartidaVM } from '../viewmodels/PartidaVM';
import { IAjedrezUseCase } from '../../domain/interfaces/IAjedrezUseCase';
import { Partida } from '../../domain/entities/Partida';
import { Color } from '../../core/types';

type PartidaContextValue = {
  vm?: PartidaVM;
};

const PartidaContext = createContext<PartidaContextValue>({});

export const PartidaProvider: React.FC<{ useCase: IAjedrezUseCase; miNombreJugador: string; children: React.ReactNode }> = ({ useCase, miNombreJugador, children }) => {
  const vm = useMemo(() => new PartidaVM(useCase), [useCase]);

  useEffect(() => {
    // Suscribimos el useCase para inicializar la VM cuando llegue PartidaIniciada
    const onPartidaIniciada = (partida: Partida) => {
      try {
        // Determinar color del cliente comparando nombres (asegúrate de que DTOs tengan nombre)
        let miColor: Color = 'Blanca';
        try {
          const nombreBlancas = partida.jugadorBlancas?.nombre ?? '';
          const nombreNegras = partida.jugadorNegras?.nombre ?? '';
          if (miNombreJugador && nombreNegras && miNombreJugador === nombreNegras) {
            miColor = 'Negra';
          } else if (miNombreJugador && nombreBlancas && miNombreJugador === nombreBlancas) {
            miColor = 'Blanca';
          } else {
            // fallback: si no coincide, intentar inferir por connectionId u otra lógica
            miColor = 'Blanca';
          }
        } catch (err) {
          miColor = 'Blanca';
        }

        vm.inicializarPartida(partida, miColor);
        console.log('[DEBUG] PartidaProvider: VM inicializada con partida', partida.id, 'miColor', miColor);
      } catch (err) {
        console.error('Error inicializando VM desde PartidaIniciada:', err, partida);
      }
    };

    useCase.subscribePartidaIniciada(onPartidaIniciada);

    // cleanup: desuscribir al desmontar
    return () => {
      try {
        useCase.unsubscribeAll();
      } catch (err) {
        // noop
      }
    };
  }, [useCase, vm, miNombreJugador]);

  return <PartidaContext.Provider value={{ vm }}>{children}</PartidaContext.Provider>;
};

export function usePartida() {
  const ctx = useContext(PartidaContext);
  // Devolver un objeto consistente para que el componente pueda desestructurar { state, actions }
  if (!ctx?.vm) return undefined;
  return {
    state: ctx.vm,
    actions: ctx.vm,
  };
}
