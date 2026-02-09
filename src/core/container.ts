/**
 * Contenedor de inyección de dependencias simple
 * Permite registrar y resolver instancias únicas (singleton pattern)
 */

class DIContainer {
  private instances: Map<string, any> = new Map();

  /**
   * Registra una instancia en el contenedor
   * @param key Identificador único
   * @param instance La instancia a registrar
   */
  public register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  /**
   * Resuelve una instancia del contenedor
   * @param key Identificador único
   * @returns La instancia registrada o lanza error si no existe
   */
  public resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      throw new Error(`Dependencia "${key}" no registrada en el contenedor`);
    }
    return this.instances.get(key) as T;
  }

  /**
   * Comprueba si una dependencia está registrada
   * @param key Identificador único
   */
  public has(key: string): boolean {
    return this.instances.has(key);
  }

  /**
   * Limpia todas las instancias registradas
   */
  public clear(): void {
    this.instances.clear();
  }
}

export const container = new DIContainer();
