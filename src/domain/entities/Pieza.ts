/**
 * Entidad Pieza
 * Representa una pieza de ajedrez en el tablero
 *
 * FIX en createFromDTO: acepta tanto camelCase (id, tipo, color, posicion)
 * como PascalCase (Id, Tipo, Color, Posicion) para ser robusto ante distintas
 * configuraciones del serializador JSON del servidor.
 */

import { Color, ID, Posicion, TipoPieza } from '../../core/types';

export interface PiezaProps {
  id: ID;
  tipo: TipoPieza;
  color: Color;
  posicion: Posicion;
  eliminada?: boolean;
}

export class Pieza {
  id: ID;
  tipo: TipoPieza;
  color: Color;
  posicion: Posicion;
  eliminada: boolean;

  /**
   * Piezas blancas nunca se han movido si están en fila 7 (posición inicial)
   * Piezas negras nunca se han movido si están en fila 0 (posición inicial)
   * Esta propiedad se usa para validar el enroque
   */
  nunca_ha_movido: boolean;

  constructor(props: PiezaProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.color = props.color;
    this.posicion = props.posicion;
    this.eliminada = props.eliminada ?? false;

    if (props.color === 'Blanca' && props.posicion.fila === 7) {
      this.nunca_ha_movido = true;
    } else if (props.color === 'Negra' && props.posicion.fila === 0) {
      this.nunca_ha_movido = true;
    } else {
      this.nunca_ha_movido = false;
    }
  }

  /**
   * Mueve la pieza a una nueva posición
   */
  mover(nuevaPosicion: Posicion): void {
    this.posicion = nuevaPosicion;
    this.nunca_ha_movido = false;
  }

  /**
   * Marca la pieza como eliminada
   */
  eliminar(): void {
    this.eliminada = true;
  }

  /**
   * Promociona un peón a otra pieza
   */
  promocionar(nuevoTipo: TipoPieza): void {
    if (this.tipo !== 'Peon') {
      throw new Error('Solo los peones pueden ser promocionados');
    }
    this.tipo = nuevoTipo;
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toPlain(): object {
    return {
      id: this.id,
      tipo: this.tipo,
      color: this.color,
      posicion: this.posicion,
      eliminada: this.eliminada,
      nunca_ha_movido: this.nunca_ha_movido,
    };
  }

  /**
   * Crea una instancia desde un DTO.
   *
   * FIX: acepta tanto camelCase (enviado por SignalR con serialización por defecto
   * de ASP.NET Core) como PascalCase (por si el servidor tiene otra configuración).
   * También normaliza la posición (fila/columna o Fila/Columna).
   * Maneja tipos numéricos para TipoPieza y Color, mapeándolos a strings.
   */
  static createFromDTO(dto: any): Pieza {
    if (!dto) throw new Error('DTO nulo para crear Pieza');

    // Leer id con tolerancia a ambas convenciones
    const id: ID = dto.id ?? dto.Id;
    const tipoRaw = dto.tipo ?? dto.Tipo;
    const colorRaw = dto.color ?? dto.Color;
    const eliminada: boolean = dto.eliminada ?? dto.Eliminada ?? false;

    // Mapear tipo si es numérico
    let tipo: TipoPieza;
    if (typeof tipoRaw === 'number') {
      const tipoMap: Record<number, TipoPieza> = {
        0: 'Peon',
        1: 'Torre',
        2: 'Caballo',
        3: 'Alfil',
        4: 'Reina',
        5: 'Rey'
      };
      tipo = tipoMap[tipoRaw];
    } else {
      tipo = tipoRaw;
    }

    // Mapear color si es numérico
    let color: Color;
    if (typeof colorRaw === 'number') {
      const colorMap: Record<number, Color> = {
        0: 'Blanca',
        1: 'Negra'
      };
      color = colorMap[colorRaw];
    } else {
      color = colorRaw;
    }

    // Normalizar posición (puede venir como { fila, columna } o { Fila, Columna })
    const posicionRaw = dto.posicion ?? dto.Posicion;
    if (!posicionRaw) {
      throw new Error(`DTO de Pieza sin posición: ${JSON.stringify(dto)}`);
    }
    const posicion: Posicion = {
      fila: posicionRaw.fila ?? posicionRaw.Fila,
      columna: posicionRaw.columna ?? posicionRaw.Columna,
    };

    if (id === undefined || id === null) throw new Error(`DTO de Pieza sin id: ${JSON.stringify(dto)}`);
    if (tipo === undefined || tipo === null) throw new Error(`DTO de Pieza sin tipo: ${JSON.stringify(dto)}`);
    if (color === undefined || color === null) throw new Error(`DTO de Pieza sin color: ${JSON.stringify(dto)}`);
    if (posicion.fila === undefined || posicion.columna === undefined) {
      throw new Error(`Posición incompleta en Pieza: ${JSON.stringify(posicionRaw)}`);
    }

    return new Pieza({ id, tipo, color, posicion, eliminada });
  }
}