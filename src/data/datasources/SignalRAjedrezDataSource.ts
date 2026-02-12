/**
 * src/data/datasources/SignalRAjedrezDataSource.ts
 * SignalR DataSource para Ajedrez (envía nombre en query, logs y manejo robusto)
 *
 * Corrección clave: cuando se crea hubConnection en start(),
 * se registran en el hub todos los event handlers previamente guardados
 * en this.eventHandlers para que los eventos lleguen aunque las
 * suscripciones se hayan hecho antes de conectar.
 */

import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { ConnectionState } from '../../core/types';

export class SignalRAjedrezDataSource {
  private hubConnection: HubConnection | null = null;
  private baseUrl: string | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private connectionState: ConnectionState = 'Disconnected';

  private buildConnection(url: string, jugadorNombre?: string): HubConnection {
    const urlWithName = jugadorNombre ? `${url}${url.includes('?') ? '&' : '?'}nombre=${encodeURIComponent(jugadorNombre)}` : url;

    return new HubConnectionBuilder()
      .withUrl(urlWithName, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 0, 0, 5000, 5000, 10000])
      .build();
  }

  async start(url: string, jugadorNombre?: string): Promise<void> {
    try {
      this.connectionState = 'Connecting';
      this.baseUrl = url;

      if (this.hubConnection) {
        try {
          await this.hubConnection.stop();
        } catch (err) {
          console.warn('[SignalR DS] Error al detener conexión previa:', err);
        }
        this.hubConnection = null;
      }

      console.log('[SignalR DS] buildConnection con nombre:', jugadorNombre);
      this.hubConnection = this.buildConnection(url, jugadorNombre);

      // Re-attach global lifecycle handlers
      this.hubConnection.onreconnecting(() => {
        this.connectionState = 'Reconnecting';
        this.emitEvent('connectionStateChanged', 'Reconnecting');
        console.log('[SignalR DS] onreconnecting');
      });

      this.hubConnection.onreconnected(() => {
        this.connectionState = 'Connected';
        this.emitEvent('connectionStateChanged', 'Connected');
        console.log('[SignalR DS] onreconnected');
      });

      this.hubConnection.onclose(() => {
        this.connectionState = 'Disconnected';
        this.emitEvent('connectionStateChanged', 'Disconnected');
        console.log('[SignalR DS] onclose');
      });

      // IMPORTANT: si ya había handlers registrados antes de crear la conexión,
      // los atamos ahora al hubConnection para que SignalR los invoque.
      if (this.eventHandlers.size > 0) {
        for (const eventName of this.eventHandlers.keys()) {
          try {
            (this.hubConnection as any).on(eventName, (...args: any[]) => {
              this.emitEvent(eventName, ...args);
            });
          } catch (err) {
            console.warn(`[SignalR DS] No se pudo attach event ${eventName} al hub:`, err);
          }
        }
      }

      console.log('[SignalR DS] iniciando hubConnection.start()');
      await this.hubConnection.start();
      this.connectionState = 'Connected';
      this.emitEvent('connectionStateChanged', 'Connected');
      console.log('[SignalR DS] Conexión establecida (Connected)');

      // Set player name after connecting
      if (jugadorNombre) {
        await this.invoke('SetNombreJugador', jugadorNombre);
        console.log('[SignalR DS] Nombre de jugador establecido:', jugadorNombre);
      }
    } catch (error) {
      this.connectionState = 'Disconnected';
      console.error('[SignalR DS] Error conectando a SignalR:', error);
      throw new Error(`No se pudo conectar a ${url}: ${error}`);
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.hubConnection) {
        this.connectionState = 'Disconnected';
        await this.hubConnection.stop();
        this.hubConnection = null;
        console.log('[SignalR DS] Conexión detenida');
      }
    } catch (error) {
      console.error('[SignalR DS] Error deteniendo conexión SignalR:', error);
    }
  }

  async invoke(method: string, ...args: any[]): Promise<void> {
    try {
      if (!this.hubConnection) {
        throw new Error('Conexión no inicializada');
      }

      if (this.hubConnection.state !== HubConnectionState.Connected) {
        throw new Error('Conexión no está establecida');
      }

      await (this.hubConnection as any).invoke(method, ...args);
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('connection being closed') || msg.includes('Invocation canceled')) {
        console.log(`[SignalR DS] Invocación de ${method} cancelada (conexión cerrada)`);
        return;
      }
      console.error(`[SignalR DS] Error invocando ${method}:`, error);
      throw error;
    }
  }

  on(eventName: string, handler: Function): void {
    // Guardamos el handler localmente siempre
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);

    // Si la hubConnection ya existe, también la atamos inmediatamente
    if (this.hubConnection) {
      try {
        (this.hubConnection as any).on(eventName, (...args: any[]) => {
          this.emitEvent(eventName, ...args);
        });
      } catch (err) {
        console.warn(`[SignalR DS] Error al registrar handler en hubConnection para ${eventName}:`, err);
      }
    }
  }

  off(eventName: string): void {
    if (this.hubConnection) {
      try {
        (this.hubConnection as any).off(eventName);
      } catch {
        // noop
      }
    }
    this.eventHandlers.delete(eventName);
  }

  offAll(): void {
    if (this.hubConnection) {
      try {
        (this.hubConnection as any).offAll?.();
      } catch {
        this.eventHandlers.forEach((_, eventName) => {
          try { (this.hubConnection as any).off(eventName); } catch {}
        });
      }
    }
    this.eventHandlers.clear();
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  private emitEvent(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[SignalR DS] Error en handler de ${eventName}:`, error);
        }
      });
    }
  }
}
