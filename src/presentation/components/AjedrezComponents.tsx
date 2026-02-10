/**
 * Componentes de UI para el ajedrez
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Color, Posicion, TipoPieza } from '../../core/types';
import { Pieza } from '../../domain/entities/Pieza';
import { Tablero } from '../../domain/entities/Tablero';

// Colores y estilos
const CASILLA_BLANCA = '#F0D9B5';
const CASILLA_NEGRA = '#B58863';
const CASILLA_SELECCIONADA = '#BACA44';
const MOVIMIENTO_POSIBLE = '#7CB342'; // Verde para movimientos posibles
const COLOR_ERROR = '#F44336'; // Rojo para errores

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tablero: {
    borderWidth: 3,
    borderColor: '#8B7355',
    backgroundColor: '#654321',
    marginBottom: 20,
    alignSelf: 'center',
  },
  fila: {
    flexDirection: 'row',
  },
  casilla: {
    width: 40, // Ajustar según pantalla, idealmente usar Dimensions
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  piezaTexto: {
    fontSize: 28,
  },
  boton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    alignItems: 'center',
  },
  botonTexto: {
    color: 'white',
    fontWeight: 'bold',
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc',
  },
  botonAmarillo: {
    backgroundColor: '#FFC107',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    width: '100%',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  }
});

// Helpers visuales para piezas
const getSimboloPieza = (tipo: TipoPieza, color: Color) => {
    const simbolos: any = {
        'Peon': { 'Blanca': '♙', 'Negra': '♟' },
        'Torre': { 'Blanca': '♖', 'Negra': '♜' },
        'Caballo': { 'Blanca': '♘', 'Negra': '♞' },
        'Alfil': { 'Blanca': '♗', 'Negra': '♝' },
        'Reina': { 'Blanca': '♕', 'Negra': '♛' },
        'Rey': { 'Blanca': '♔', 'Negra': '♚' },
    };
    return simbolos[tipo]?.[color] || '?';
};

interface CasillaProps {
    fila: number;
    columna: number;
    esBlanca: boolean;
    pieza: Pieza | null;
    esSeleccionada: boolean;
    esMovimientoPosible: boolean;
    onPress: () => void;
}

const Casilla: React.FC<CasillaProps> = ({ fila, columna, esBlanca, pieza, esSeleccionada, esMovimientoPosible, onPress }) => {
    // Prioridad: Seleccionada > Movimiento Posible > Color normal
    let backgroundColor = esBlanca ? CASILLA_BLANCA : CASILLA_NEGRA;
    if (esMovimientoPosible) backgroundColor = MOVIMIENTO_POSIBLE;
    if (esSeleccionada) backgroundColor = CASILLA_SELECCIONADA;

    return (
        <TouchableOpacity style={[estilos.casilla, { backgroundColor }]} onPress={onPress}>
            {pieza && (
                <Text style={[estilos.piezaTexto, { color: pieza.color === 'Blanca' ? '#fff' : '#000', textShadowColor: '#000', textShadowRadius: 1 }]}>
                    {getSimboloPieza(pieza.tipo, pieza.color)}
                </Text>
            )}
        </TouchableOpacity>
    );
};

interface TableroComponentProps {
    tablero: Tablero;
    miColor: Color | null;
    piezaSeleccionada: Pieza | null;
    movimientosPosibles: Posicion[];
    onCasillaPress: (posicion: Posicion) => void;
}

export const TableroComponent: React.FC<TableroComponentProps> = ({
    tablero,
    miColor,
    piezaSeleccionada,
    movimientosPosibles,
    onCasillaPress
}) => {
    // Si soy negras, invierto el orden de renderizado (fila 0 abajo, fila 7 arriba -> visualmente)
    // Lógica estándar: Fila 7 (Negras) arriba, Fila 0 (Blancas) abajo.
    // Si soy Negras: Quiero ver Fila 0 arriba, Fila 7 abajo.
    const esInvertido = miColor === 'Negra';
    
    // Generar índices 0..7
    let filas = Array.from({ length: 8 }, (_, i) => i); // [0,1,2,3,4,5,6,7]
    
    // Orden visual: normalmente se dibuja de arriba a abajo.
    // Arriba es Fila 7. Abajo es Fila 0.
    // Por tanto, el array a iterar debe ser [7,6,5...0].
    filas = filas.reverse(); // [7, 6 ... 0] -> Renderizado estándar
    
    // Si está invertido (soy Negra), quiero ver mi lado (Fila 7) abajo.
    // Entonces arriba debe estar la Fila 0.
    // Invertimos de nuevo el array de renderizado.
    if (esInvertido) {
        filas = filas.reverse(); // [0, 1 ... 7] -> Arriba Fila 0
    }

    // Para las columnas: Izq a Der. 0 a 7.
    // Si soy Negra, la col 0 (a) está a la derecha? No, tablero girado 180 grados.
    // Col 7 (h) a la izquierda.
    let columnas = Array.from({ length: 8 }, (_, i) => i);
    if (esInvertido) {
        columnas = columnas.reverse();
    }

    return (
        <View style={estilos.tablero}>
            {filas.map((fila) => (
                <View key={fila} style={estilos.fila}>
                    {columnas.map((columna) => {
                        const posicion = { fila, columna };
                        const pieza = tablero.obtenerPieza(posicion);
                        // Tablero ajedrez: (fila+col) par -> blanca? No, depende de convención.
                        // Casilla a1 (0,0) es Negra. b1 (0,1) es Blanca.
                        // Suma par -> Negra. Suma impar -> Blanca.
                        const esCasillaBlanca = (fila + columna) % 2 !== 0;

                        const esSeleccionada = piezaSeleccionada
                            ? (piezaSeleccionada.posicion.fila === fila && piezaSeleccionada.posicion.columna === columna)
                            : false;

                        // Verificar si esta posición es un movimiento posible
                        const esMovimientoPosible = movimientosPosibles.some(
                            m => m.fila === fila && m.columna === columna
                        );

                        return (
                            <Casilla
                                key={`${fila}-${columna}`}
                                fila={fila}
                                columna={columna}
                                esBlanca={esCasillaBlanca}
                                pieza={pieza}
                                esSeleccionada={esSeleccionada}
                                esMovimientoPosible={esMovimientoPosible}
                                onPress={() => onCasillaPress(posicion)}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

// ... BotonesAccion, ModalPromocion, ModalFinPartida, InputNombre, Boton ...
// (Se asumen sin cambios lógicos mayores, solo se mantienen para completar el archivo si se requiere)

interface BotonesAccionProps {
    confirmarMovimiento: () => void;
    deshacerMovimiento: () => void;
    solicitarTablas: () => void;
    retirarTablas: () => void;
    rendirse: () => void;
    hayMovimientoPendiente: boolean;
    tablasOfrecidas: boolean; // Si me están ofreciendo tablas
    solicitadasTablas: boolean; // Si yo solicité
}

export const BotonesAccion: React.FC<BotonesAccionProps> = ({
    confirmarMovimiento,
    deshacerMovimiento,
    solicitarTablas,
    retirarTablas,
    rendirse,
    hayMovimientoPendiente,
    tablasOfrecidas,
    solicitadasTablas
}) => {
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Boton 
                    title="Confirmar" 
                    onPress={confirmarMovimiento} 
                    disabled={!hayMovimientoPendiente} 
                    style={!hayMovimientoPendiente ? estilos.botonDeshabilitado : {}}
                />
                <Boton 
                    title="Deshacer" 
                    onPress={deshacerMovimiento} 
                    disabled={!hayMovimientoPendiente}
                    style={!hayMovimientoPendiente ? estilos.botonDeshabilitado : {}}
                />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                {tablasOfrecidas ? (
                    <Boton 
                        title="Aceptar Tablas" 
                        onPress={solicitarTablas} // Al solicitar si ya hay oferta, se acepta
                        style={estilos.botonAmarillo}
                    />
                ) : (
                    <Boton 
                        title={solicitadasTablas ? "Retirar Tablas" : "Ofrecer Tablas"} 
                        onPress={solicitadasTablas ? retirarTablas : solicitarTablas} 
                        style={solicitadasTablas ? estilos.botonDeshabilitado : {}}
                    />
                )}
                <Boton title="Rendirse" onPress={rendirse} style={{ backgroundColor: COLOR_ERROR }} />
            </View>
        </View>
    );
};

interface ModalPromocionProps {
    visible: boolean;
    onPromocion: (tipo: TipoPieza) => void;
}

export const ModalPromocion: React.FC<ModalPromocionProps> = ({ visible, onPromocion }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={estilos.modalContainer}>
                <View style={estilos.modalContent}>
                    <Text style={estilos.tituloModal}>Promoción de Peón</Text>
                    <View style={{ flexDirection: 'row' }}>
                        {['Reina', 'Torre', 'Alfil', 'Caballo'].map((tipo) => (
                            <TouchableOpacity key={tipo} onPress={() => onPromocion(tipo as TipoPieza)} style={estilos.boton}>
                                <Text style={estilos.botonTexto}>{tipo}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Componente InfoPartida
interface InfoPartidaProps {
    nombreOponente: string;
    tiempoTranscurrido: number;
    numeroTurnos: number;
    mensajeTurno: string | null;
    mensajeJaque: string | null;
}

export const InfoPartida: React.FC<InfoPartidaProps> = ({
    nombreOponente,
    tiempoTranscurrido,
    numeroTurnos,
    mensajeTurno,
    mensajeJaque
}) => {
    const minutos = Math.floor(tiempoTranscurrido / 60);
    const segundos = tiempoTranscurrido % 60;

    return (
        <View style={{ padding: 12, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#ddd' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>vs {nombreOponente}</Text>
            <Text>Tiempo: {minutos}:{segundos.toString().padStart(2, '0')}</Text>
            <Text>Turno: {numeroTurnos}</Text>
            {mensajeTurno && <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{mensajeTurno}</Text>}
            {mensajeJaque && <Text style={{ color: '#F44336', fontWeight: 'bold', marginTop: 4 }}>{mensajeJaque}</Text>}
        </View>
    );
};

// Componente ContadorPiezas
interface ContadorPiezasProps {
    piezasEliminadas: Map<TipoPieza, number>;
    color: Color;
}

export const ContadorPiezas: React.FC<ContadorPiezasProps> = ({ piezasEliminadas, color }) => {
    const tipos: TipoPieza[] = ['Peon', 'Torre', 'Caballo', 'Alfil', 'Reina'];
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }}>
            {tipos.map(tipo => {
                const cantidad = piezasEliminadas.get(tipo) || 0;
                if (cantidad === 0) return null;
                return (
                    <View key={tipo} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                        <Text style={{ fontSize: 20 }}>{getSimboloPieza(tipo, color)}</Text>
                        <Text style={{ marginLeft: 2, fontWeight: 'bold' }}>×{cantidad}</Text>
                    </View>
                );
            })}
        </View>
    );
};

// Componente ModalFinPartida
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
    onVolverAlMenu
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={estilos.modalContainer}>
                <View style={estilos.modalContent}>
                    <Text style={estilos.tituloModal}>{resultado}</Text>
                    <Text style={{ marginBottom: 20 }}>{tipo}</Text>
                    <Boton title="Volver al Menú" onPress={onVolverAlMenu} />
                </View>
            </View>
        </Modal>
    );
};

// Resto de exports simples
export const InputNombre: React.FC<any> = (props) => <TextInput {...props} style={estilos.input} />;
export const Boton: React.FC<any> = ({ title, onPress, disabled, style }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[estilos.boton, style]}>
        <Text style={estilos.botonTexto}>{title}</Text>
    </TouchableOpacity>
);