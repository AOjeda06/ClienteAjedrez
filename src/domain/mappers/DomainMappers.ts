/**
 * src/domain/mappers/DomainMappers.ts
 * Mappers tolerantes: aceptan DTOs con PascalCase o camelCase y validan antes de mapear.
 */

import { Jugador } from '../entities/Jugador';
import { Pieza } from '../entities/Pieza';
import { Movimiento } from '../entities/Movimiento';
import { Tablero } from '../entities/Tablero';
import { Sala } from '../entities/Sala';
import { Partida } from '../entities/Partida';

export class JugadorDomainMapper {
  static toDomain(dto: any): Jugador {
    return Jugador.createFromDTO(dto);
  }
}

export class PiezaDomainMapper {
  static toDomain(dto: any): Pieza {
    return Pieza.createFromDTO(dto);
  }
}

export class MovimientoDomainMapper {
  static toDomain(dto: any): Movimiento {
    return Movimiento.createFromDTO(dto);
  }
}

export class TableroDomainMapper {
  static toDomain(dto: any): Tablero {
    return Tablero.createFromDTO(dto);
  }
}

export class SalaDomainMapper {
  static toDomain(dto: any): Sala {
    return Sala.createFromDTO(dto);
  }
}

export class PartidaDomainMapper {
  static toDomain(dto: any): Partida {
    return Partida.createFromDTO(dto);
  }
}
