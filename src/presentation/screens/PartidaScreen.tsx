/**
 * Pantalla de Partida
 */

import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { usePartida } from '../hooks/useViewModels';
import {
  TableroComponent,
  InfoPartida,
  BotonesAccion,
  ContadorPiezas,
  ModalPromocion,
  ModalFinPartida,
  Boton,
} from '../components/AjedrezComponents';

type RootStackParamList = {
  Partida: { nombreJugador: string };
  MenuPrincipal: { nombreJugador: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Partida'>;

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contenido: {
    flex: 1,
    padding: 8,
  },
  seccionContadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  contador: {
    flex: 1,
    alignItems: 'center',
  },
  tituloContador: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pie: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: '#F44336',
    margin: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
});

const mensajeFinPartida = (tipo: string): string => {
  switch (tipo) {
    case 'JaqueMate':
      return 'Jaque Mate';
    case 'Tablas':
      return 'Tablas';
    case 'Rendicion':
      return 'Rendición';
    case 'Abandono':
      return 'Abandono';
    default:
      return 'Fin de Partida';
  }
};

const mensajeResultado = (resultado: string): string => {
  switch (resultado) {
    case 'Victoria':
      return '🎉 ¡Ganaste!';
    case 'Derrota':
      return '😔 Perdiste';
    case 'Empate':
      return '🤝 Empate';
    default:
      return 'Partida finalizada';
  }
};

export const PartidaScreen = observer(({ route, navigation }: Props) => {
  const { state, actions } = usePartida();
  const mounted = useRef(true);
  const { nombreJugador } = route.params;

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (state.mostrarFinPartida && state.partida) {
      Alert.alert(
        mensajeResultado(state.partida.resultado as string),
        `Tipo: ${mensajeFinPartida(state.partida.tipoFin || '')}`,
        [
          {
            text: 'Volver al Menú',
            onPress: () => {
              actions.volverAlMenu();
              navigation.navigate('MenuPrincipal', { nombreJugador });
            },
          },
        ]
      );
    }
  }, [state.mostrarFinPartida]);

  useEffect(() => {
    if (state.tablasOfrecidas) {
      Alert.alert(
        'Tablas Ofrecidas',
        `${state.nombreOponente} ofrece tablas`,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              actions.solicitarTablas();
            },
          },
          {
            text: 'Rechazar',
            onPress: () => {
              actions.retirarTablas();
            },
          },
        ]
      );
    }
  }, [state.tablasOfrecidas]);

  if (!state.partida || !state.tablero || !state.miColor) {
    return (
      <View style={estilos.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando partida...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.container}>
      {/* Información de partida y oponente */}
      <InfoPartida
        nombreOponente={state.nombreOponente}
        tiempoTranscurrido={state.partida.tiempoTranscurrido}
        numeroTurnos={state.partida.numeroTurnos}
        mensajeTurno={state.mensajeTurno}
        mensajeJaque={state.mensajeJaque}
      />

      {/* Contador de piezas eliminadas (oponente) */}
      {state.miColor === 'Blanca' && (
        <View style={estilos.seccionContadores}>
          <View style={estilos.contador}>
            <Text style={estilos.tituloContador}>Piezas Negras Capturadas</Text>
            <ContadorPiezas piezasEliminadas={state.piezasEliminadasNegras} color="Negra" />
          </View>
        </View>
      )}
      {state.miColor === 'Negra' && (
        <View style={estilos.seccionContadores}>
          <View style={estilos.contador}>
            <Text style={estilos.tituloContador}>Piezas Blancas Capturadas</Text>
            <ContadorPiezas piezasEliminadas={state.piezasEliminadasBlancas} color="Blanca" />
          </View>
        </View>
      )}

      {/* Tablero */}
      <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }}>
        <TableroComponent
          tablero={state.tablero}
          piezaSeleccionada={state.piezaSeleccionada}
          movimientosPosibles={state.movimientosPosibles}
          onCasillaPress={actions.seleccionarCasilla}
          miColor={state.miColor}
        />
      </View>

      {/* Contador de piezas eliminadas (propia) */}
      {state.miColor === 'Blanca' && (
        <View style={estilos.seccionContadores}>
          <View style={estilos.contador}>
            <Text style={estilos.tituloContador}>Piezas Blancas Capturadas</Text>
            <ContadorPiezas piezasEliminadas={state.piezasEliminadasBlancas} color="Blanca" />
          </View>
        </View>
      )}
      {state.miColor === 'Negra' && (
        <View style={estilos.seccionContadores}>
          <View style={estilos.contador}>
            <Text style={estilos.tituloContador}>Piezas Negras Capturadas</Text>
            <ContadorPiezas piezasEliminadas={state.piezasEliminadasNegras} color="Negra" />
          </View>
        </View>
      )}

      {/* Error */}
      {state.error && <Text style={estilos.error}>{state.error}</Text>}

      {/* Botones de acción */}
      <BotonesAccion
        onTablas={() => {
          if (state.solicitadasTablas) {
            actions.retirarTablas();
          } else {
            actions.solicitarTablas();
          }
        }}
        onRendirse={() => {
          Alert.alert('¿Estás seguro?', 'Una vez que te rindas, perderás la partida.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Rendirse', onPress: actions.rendirse, style: 'destructive' },
          ]);
        }}
        tablasOfrecidas={state.tablasOfrecidas}
        solicitadasTablas={state.solicitadasTablas}
      />

      {/* Modal de promoción */}
      <ModalPromocion
        visible={state.mostrarPromocion}
        onPromocion={async (tipo) => {
          await actions.promocionarPeon(tipo);
          await actions.confirmarMovimiento();
        }}
      />

      {/* Modal de fin de partida */}
      <ModalFinPartida
        visible={state.mostrarFinPartida}
        resultado={mensajeResultado(state.partida.resultado as string)}
        tipo={mensajeFinPartida(state.partida.tipoFin || '')}
        onVolverAlMenu={() => {
          actions.volverAlMenu();
          navigation.navigate('MenuPrincipal', { nombreJugador });
        }}
      />

      {/* Pie con botón deshacer */}
      <View style={estilos.pie}>
        <Boton
          title="Deshacer Último Movimiento"
          onPress={actions.deshacerMovimiento}
          style={{ backgroundColor: '#FF9800' }}
        />
      </View>
    </View>
  );
});
