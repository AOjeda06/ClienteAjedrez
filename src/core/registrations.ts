// src/core/registrations.ts
/**
 * Registro de singletons en el contenedor.
 * Importa la instancia `container` desde src/core/container.ts
 * y registra las instancias concretas (data source, repo, usecase).
 *
 * Este archivo debe importarse UNA VEZ desde el entry point (app/_layout.tsx o app/index.tsx).
 */

import { container } from './container';
import { SignalRAjedrezDataSource } from '../data/datasources/SignalRAjedrezDataSource';
import { AjedrezRepositorySignalR } from '../data/repositories/AjedrezRepositorySignalR';
import { AjedrezUseCase } from '../domain/usecases/AjedrezUseCase';
import { IAjedrezRepository } from '../domain/repositories/IAjedrezRepository';
import { IAjedrezUseCase } from '../domain/interfaces/IAjedrezUseCase';

// Registrar SignalRAjedrezDataSource si no existe
if (!container.has('SignalRAjedrezDataSource')) {
  const ds = new SignalRAjedrezDataSource();
  container.register('SignalRAjedrezDataSource', ds);
}

// Registrar AjedrezRepository (usa la instancia del data source)
if (!container.has('AjedrezRepository')) {
  const ds = container.resolve<SignalRAjedrezDataSource>('SignalRAjedrezDataSource');
  const repo = new AjedrezRepositorySignalR(ds);
  container.register('AjedrezRepository', repo as IAjedrezRepository);
}

// Registrar AjedrezUseCase (usa la instancia del repo)
if (!container.has('AjedrezUseCase')) {
  const repo = container.resolve<IAjedrezRepository>('AjedrezRepository');
  const usecase = new AjedrezUseCase(repo);
  container.register('AjedrezUseCase', usecase as IAjedrezUseCase);
}

export { container };
export default container;
