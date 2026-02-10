// src/core/container.ts
/**
 * Definición del contenedor DI (instancia única).
 * No registrar dependencias aquí para evitar import circulares.
 */

class DIContainer {
  private instances: Map<string, any> = new Map();

  public register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  public resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      throw new Error(`Dependencia "${key}" no registrada en el contenedor`);
    }
    return this.instances.get(key) as T;
  }

  public has(key: string): boolean {
    return this.instances.has(key);
  }

  public clear(): void {
    this.instances.clear();
  }
}

export const container = new DIContainer();
export default container;
