/**
 * SignalR DataSource para Ajedrez
 * Gestiona la conexión con el servidor SignalR
 */

import { HubConnectionBuilder, HubConnection, HttpTransportType, HubConnectionState } from '@microsoft/signalr';
import { ConnectionState } from '../../core/types';

export class SignalRAjedrezDataSource {
  private hubConnection: HubConnection | null = null;
  private baseUrl: string | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private connectionState: ConnectionState = 'Disconnected';

  /**
   * Construye una conexión SignalR
   */
  private buildConnection(url: string): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(url, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 0, 0, 5000, 5000, 10000])
      .build();
  }

  /**
   * Inicia la conexión con el servidor
   */
  async start(url: string, jugadorNombre: string): Promise<void> {
    try {
      this.connectionState = 'Connecting';
      this.baseUrl = url;

      if (this.hubConnection) {
        await this.hubConnection.stop();
      }

      this.hubConnection = this.buildConnection(url);

      // Configurar listeners de reconexión
      this.hubConnection.onreconnecting(() => {
        this.connectionState = 'Reconnecting';
        this.emitEvent('connectionStateChanged', 'Reconnecting');
      });

      this.hubConnection.onreconnected(() => {
        this.connectionState = 'Connected';
        this.emitEvent('connectionStateChanged', 'Connected');
      });

      this.hubConnection.onclose(() => {
        this.connectionState = 'Disconnected';
        this.emitEvent('connectionStateChanged', 'Disconnected');
      });

      await this.hubConnection.start();

      this.connectionState = 'Connected';
      this.emitEvent('connectionStateChanged', 'Connected');

      // Invocar método del servidor para registrar al jugador
      if (jugadorNombre && jugadorNombre.trim()) {
        await this.invoke('SetNombreJugador', jugadorNombre);
      }
    } catch (error) {
      this.connectionState = 'Disconnected';
      console.error('Error conectando a SignalR:', error);
      throw new Error(`No se pudo conectar a ${url}: ${error}`);
    }
  }

  /**
   * Detiene la conexión
   */
  async stop(): Promise<void> {
    try {
      if (this.hubConnection) {
        this.connectionState = 'Disconnected';
        await this.hubConnection.stop();
        this.hubConnection = null;
      }
    } catch (error) {
      console.error('Error deteniendo conexión SignalR:', error);
    }
  }

  /**
   * Invoca un método en el servidor
   * @param method Nombre del método a invocar
   * @param args Argumentos del método
   */
  async invoke(method: string, ...args: any[]): Promise<void> {
    try {
      if (!this.hubConnection) {
        throw new Error('Conexión no inicializada');
      }

      if (this.hubConnection.state !== HubConnectionState.Connected) {
        throw new Error('Conexión no está establecida');
      }

      await (this.hubConnection as any).invoke(method, ...args);
    } catch (error) {
      console.error(`Error invocando ${method}:`, error);
      throw error;
    }
  }

  /**
   * Se suscribe a un evento del servidor
   */
  on(eventName: string, handler: Function): void {
    if (!this.hubConnection) {
      console.warn('Intentando registrar listener sin conexión');
      return;
    }

    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);

      // Primera suscripción a este evento
      (this.hubConnection as any).on(eventName, (...args: any[]) => {
        this.emitEvent(eventName, ...args);
      });
    }

    const handlers = this.eventHandlers.get(eventName)!;
    handlers.push(handler);
  }

  /**
   * Se desuscribe de un evento
   */
  off(eventName: string): void {
    if (this.hubConnection) {
      (this.hubConnection as any).off(eventName);
    }
    this.eventHandlers.delete(eventName);
  }

  /**
   * Se desuscribe de todos los eventos
   */
  offAll(): void {
    if (this.hubConnection) {
      this.hubConnection.offAll();
    }
    this.eventHandlers.clear();
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Emite un evento a todos los listeners registrados
   * (uso interno)
   */
  private emitEvent(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error en handler de ${eventName}:`, error);
        }
      });
    }
  }
}
