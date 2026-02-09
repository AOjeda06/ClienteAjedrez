/**
 * Layout global con Expo Router
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { container } from '../src/core/container';
import { SignalRAjedrezDataSource } from '../src/data/datasources/SignalRAjedrezDataSource';
import { AjedrezRepositorySignalR } from '../src/data/repositories/AjedrezRepositorySignalR';
import { AjedrezUseCase } from '../src/domain/usecases/AjedrezUseCase';

export default function RootLayout() {
  useEffect(() => {
    // Inicializar contenedor de DI
    const dataSource = new SignalRAjedrezDataSource();
    const repository = new AjedrezRepositorySignalR(dataSource);
    const useCase = new AjedrezUseCase(repository);

    container.register('SignalRAjedrezDataSource', dataSource);
    container.register('AjedrezRepositorySignalR', repository);
    container.register('AjedrezUseCase', useCase);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
}
