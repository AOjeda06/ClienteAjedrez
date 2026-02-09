/**
 * Componentes de UI para el ajedrez
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Pieza } from '../../domain/entities/Pieza';
import { Tablero } from '../../domain/entities/Tablero';
import { Posicion, TipoPieza, Color, posicionesIguales } from '../../core/types';

// Colores y estilos
const CASILLA_BLANCA = '#F0D9B5';
const CASILLA_NEGRA = '#B58863';
const CASILLA_SELECCIONADA = '#BACA44';
const MOVIMIENTO_POSIBLE = '#5CB85C';
const COLOR_PRIMARIO = '#2196F3';
const COLOR_ERROR = '#F44336';

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tablero: {
    borderWidth: 3,
    borderColor: '#8B7355',
    backgroundColor: '#654321',
  },
  fila: {
    flexDirection: 'row',
  },
  casilla: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#666',
  },
  pieza: {
    fontSize: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
    fontSize: 16,
  },
  boton: {
    backgroundColor: COLOR_PRIMARIO,
    padding: 12,
    marginVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc',
  },
  error: {
    color: COLOR_ERROR,
    marginVertical: 8,
    fontSize: 14,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
});

// Componente: Casilla del tablero
interface CasillaProps {
  posicion: Posicion;
  pieza?: Pieza | null;
  seleccionada?: boolean;
  movimientoPosible?: boolean;
  onPress?: (posicion: Posicion) => void;
  miColor?: Color;
}

export const Casilla: React.FC<CasillaProps> = ({
  posicion,
  pieza,
  seleccionada,
  movimientoPosible,
  onPress,
  miColor,
}) => {
  const esBlanca = (posicion.fila + posicion.columna) % 2 === 0;
  let backgroundColor = esBlanca ? CASILLA_BLANCA : CASILLA_NEGRA;

  if (seleccionada) {
    backgroundColor = CASILLA_SELECCIONADA;
  } else if (movimientoPosible) {
    backgroundColor = MOVIMIENTO_POSIBLE;
  }

  return (
    <TouchableOpacity
      style={[estilos.casilla, { backgroundColor }]}
      onPress={() => onPress?.(posicion)}
    >
      {pieza && <PiezaComponent tipo={pieza.tipo} color={pieza.color} />}
    </TouchableOpacity>
  );
};

// Componente: Pieza visual
interface PiezaComponentProps {
  tipo: TipoPieza;
  color: Color;
  size?: number;
}

const piezasEmojis: Record<TipoPieza, Record<Color, string>> = {
  Peon: { Blanca: '♙', Negra: '♟' },
  Torre: { Blanca: '♖', Negra: '♜' },
  Caballo: { Blanca: '♘', Negra: '♞' },
  Alfil: { Blanca: '♗', Negra: '♝' },
  Reina: { Blanca: '♕', Negra: '♛' },
  Rey: { Blanca: '♔', Negra: '♚' },
};

export const PiezaComponent: React.FC<PiezaComponentProps> = ({ tipo, color, size = 32 }) => {
  return (
    <Text style={[estilos.pieza, { fontSize: size }]}>
      {piezasEmojis[tipo]?.[color] || '?'}
    </Text>
  );
};

// Componente: Tablero completo
interface TableroComponentProps {
  tablero: Tablero;
  piezaSeleccionada?: Pieza | null;
  movimientosPosibles?: Posicion[];
  onCasillaPress: (posicion: Posicion) => void;
  miColor: Color;
}

export const TableroComponent: React.FC<TableroComponentProps> = ({
  tablero,
  piezaSeleccionada,
  movimientosPosibles = [],
  onCasillaPress,
  miColor,
}) => {
  const filas = [];
  const esVertidoInvertido = miColor === 'Negra';

  for (let fila = 0; fila < 8; fila++) {
    const columnas = [];
    const filaActual = esVertidoInvertido ? 7 - fila : fila;

    for (let columna = 0; columna < 8; columna++) {
      const columnaActual = esVertidoInvertido ? 7 - columna : columna;
      const posicion = { fila: filaActual, columna: columnaActual };
      const pieza = tablero.obtenerPieza(posicion);
      const seleccionada = piezaSeleccionada && posicionesIguales(piezaSeleccionada.posicion, posicion);
      const movimientoPosible = movimientosPosibles.some(m => posicionesIguales(m, posicion));

      columnas.push(
        <Casilla
          key={`${fila}-${columna}`}
          posicion={posicion}
          pieza={pieza}
          seleccionada={seleccionada}
          movimientoPosible={movimientoPosible}
          onPress={onCasillaPress}
          miColor={miColor}
        />
      );
    }

    filas.push(
      <View key={`fila-${fila}`} style={estilos.fila}>
        {columnas}
      </View>
    );
  }

  return <View style={estilos.tablero}>{filas}</View>;
};

// Componente: Información de la partida
interface InfoPartidaProps {
  nombreOponente: string;
  tiempoTranscurrido: number;
  numeroTurnos: number;
  mensajeTurno?: string | null;
  mensajeJaque?: string | null;
}

export const InfoPartida: React.FC<InfoPartidaProps> = ({
  nombreOponente,
  tiempoTranscurrido,
  numeroTurnos,
  mensajeTurno,
  mensajeJaque,
}) => {
  const minutos = Math.floor(tiempoTranscurrido / 60);
  const segundos = tiempoTranscurrido % 60;

  return (
    <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        {nombreOponente}
      </Text>
      <Text style={estilos.info}>
        Tiempo: {minutos}:{segundos.toString().padStart(2, '0')} | Turnos: {numeroTurnos}
      </Text>
      {mensajeTurno && <Text style={estilos.info}>{mensajeTurno}</Text>}
      {mensajeJaque && <Text style={{ ...estilos.info, color: COLOR_ERROR, fontWeight: 'bold' }}>
        {mensajeJaque}
      </Text>}
    </View>
  );
};

// Componente: Botones de acción
interface BotonesAccionProps {
  onTablas: () => void;
  onRendirse: () => void;
  tablasOfrecidas?: boolean;
  solicitadasTablas?: boolean;
}

export const BotonesAccion: React.FC<BotonesAccionProps> = ({
  onTablas,
  onRendirse,
  tablasOfrecidas,
  solicitadasTablas,
}) => {
  return (
    <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
      <TouchableOpacity
        style={[estilos.boton, solicitadasTablas && { backgroundColor: '#FF9800' }]}
        onPress={onTablas}
      >
        <Text style={estilos.botonTexto}>
          {solicitadasTablas ? 'Cancelar Tablas' : 'Ofrecer Tablas'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[estilos.boton, { backgroundColor: COLOR_ERROR }]} onPress={onRendirse}>
        <Text style={estilos.botonTexto}>Rendirse</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente: Contador de piezas eliminadas
interface ContadorPiezasProps {
  piezasEliminadas: Map<TipoPieza, number>;
  color: Color;
}

export const ContadorPiezas: React.FC<ContadorPiezasProps> = ({ piezasEliminadas, color }) => {
  const piezas: TipoPieza[] = ['Peon', 'Torre', 'Caballo', 'Alfil', 'Reina'];
  const items = [];

  for (const tipo of piezas) {
    const cantidad = piezasEliminadas.get(tipo) || 0;
    if (cantidad > 0) {
      items.push(
        <View key={tipo} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
          <PiezaComponent tipo={tipo} color={color} size={20} />
          <Text style={{ marginLeft: 2 }}>x{cantidad}</Text>
        </View>
      );
    }
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }}>
      {items}
    </View>
  );
};

// Componente: Modal de promoción
interface ModalPromocionProps {
  visible: boolean;
  onPromocion: (tipo: TipoPieza) => void;
}

export const ModalPromocion: React.FC<ModalPromocionProps> = ({ visible, onPromocion }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Promoción de Peón
          </Text>
          <Text style={{ marginBottom: 16, color: '#666' }}>
            Selecciona la pieza a la que deseas promover:
          </Text>
          {(['Torre', 'Caballo', 'Alfil', 'Reina'] as TipoPieza[]).map(tipo => (
            <TouchableOpacity
              key={tipo}
              style={[estilos.boton, { marginVertical: 6 }]}
              onPress={() => onPromocion(tipo)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PiezaComponent tipo={tipo} color="Blanca" />
                <Text style={estilos.botonTexto}>{tipo}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

// Componente: Modal de fin de partida
interface ModalFinPartidaProps {
  visible: boolean;
  resultado: string;
  tipo: string;
  onVolverAlMenu: () => void;
}

export const ModalFinPartida: React.FC<ModalFinPartidaProps> = ({
  visible,
  resultado,
  tipo,
  onVolverAlMenu,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: COLOR_PRIMARIO }}>
            {resultado}
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#666' }}>
            Tipo: {tipo}
          </Text>
          <TouchableOpacity
            style={[estilos.boton, { backgroundColor: COLOR_PRIMARIO }]}
            onPress={onVolverAlMenu}
          >
            <Text style={estilos.botonTexto}>Volver al Menú</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Componente: Input de nombre
interface InputNombreProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
}

export const InputNombre: React.FC<InputNombreProps> = ({
  value,
  onChangeText,
  placeholder = 'Ingresa tu nombre',
  error,
  isLoading,
}) => {
  return (
    <View>
      <TextInput
        style={[estilos.input, error && { borderColor: COLOR_ERROR }]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        editable={!isLoading}
        maxLength={20}
      />
      {error && <Text style={estilos.error}>{error}</Text>}
    </View>
  );
};

// Componente: Botón personalizado
interface BotonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const Boton: React.FC<BotonProps> = ({ title, onPress, loading, disabled, style }) => {
  return (
    <TouchableOpacity
      style={[estilos.boton, disabled && estilos.botonDeshabilitado, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={estilos.botonTexto}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
