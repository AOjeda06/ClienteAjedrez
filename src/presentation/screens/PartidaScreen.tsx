/**
 * src/presentation/screens/PartidaScreen.tsx
 * Pantalla de Partida — versión robusta que evita leer params indefinidos
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Boton,
  BotonesAccion,
  ContadorPiezas,
  InfoPartida,
  ModalConfirmacion,
  ModalFinPartida,
  ModalPromocion,
  TableroComponent,
} from '../components/AjedrezComponents';
import { usePartida } from '../hooks/useViewModels';

// Si en tu proyecto usas NativeStackScreenProps en mobile, puedes mantener la firma
// pero aquí la pantalla es compatible con ambos entornos (expo-router / navigation).
// Por simplicidad no importamos NativeStackScreenProps para evitar errores en web.

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

const mensajeResultado = (resultado: string, miColor: string | null): string => {
  switch (resultado) {
    case 'VictoriaBlancas':
      return miColor === 'Blanca' ? '🎉 ¡Ganaste!' : '😔 Perdiste';
    case 'VictoriaNegras':
      return miColor === 'Negra' ? '🎉 ¡Ganaste!' : '😔 Perdiste';
    case 'Empate':
      return '🤝 Empate';
    default:
      return 'Partida finalizada';
  }
};

export const PartidaScreen = observer((props: any) => {
  const { state, actions } = usePartida();
  const mounted = useRef(true);
  const router = useRouter();
  const [mostrarConfirmacionRendirse, setMostrarConfirmacionRendirse] = useState(false);

  // Leer params de forma segura: primero intentar props.route?.params (mobile),
  // luego useLocalSearchParams (expo-router/web).
  const localParams = useLocalSearchParams<{ nombreJugador?: string; salaId?: string }>();
  const nombreJugadorFromRoute = props?.route?.params?.nombreJugador;
  const nombreJugador = nombreJugadorFromRoute ?? (localParams?.nombreJugador ? String(localParams.nombreJugador) : undefined) ?? state?.partida?.jugadorBlancas?.nombre ?? '';

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Helper para volver al menú principal
  const volverAlMenu = () => {
    try {
      actions.volverAlMenu();
    } catch (err) {
      console.error('Error en volverAlMenu:', err);
    }
    try {
      router.replace(`/menu-principal?nombreJugador=${encodeURIComponent(nombreJugador)}`);
    } catch (err) {
      console.error('Error navegando al menú:', err);
    }
  };

  // Si no hay partida aún, mostrar pantalla de carga / espera.
  // No intentamos inicializar la partida aquí con datos inexistentes.
  if (!state.partida || !state.tablero || !state.miColor) {
    return (
      <View style={estilos.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando partida...</Text>
        </View>
      </View>
    );
  }

  // Render principal cuando la partida ya está en el estado del VM
  return (
    <ScrollView style={estilos.container} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Información de partida y oponente */}
      <InfoPartida
        nombreOponente={state.nombreOponente}
        tiempoTranscurrido={state.partida.tiempoTranscurrido}
        numeroTurnos={state.partida.numeroTurnos}
        mensajeTurno={state.mensajeTurno}
        mensajeJaque={state.mensajeJaque}
      />

      {/* Contadores de piezas */}
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
          onCasillaPress={(pos) => {
            try {
              actions.seleccionarCasilla(pos);
            } catch (err) {
              console.error('Error al seleccionar casilla:', err);
            }
          }}
          miColor={state.miColor}
        />
      </View>

      {/* Contadores opuestos */}
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
        confirmarMovimiento={() => {
          try {
            actions.confirmarMovimiento();
          } catch (err) {
            console.error('Error confirmando movimiento:', err);
          }
        }}
        deshacerMovimiento={() => {
          try {
            actions.deshacerMovimiento();
          } catch (err) {
            console.error('Error deshaciendo movimiento:', err);
          }
        }}
        solicitarTablas={() => {
          try {
            actions.solicitarTablas();
          } catch (err) {
            console.error('Error solicitando tablas:', err);
          }
        }}
        retirarTablas={() => {
          try {
            actions.retirarTablas();
          } catch (err) {
            console.error('Error retirando tablas:', err);
          }
        }}
        rendirse={() => {
          console.log('[PartidaScreen] Función rendirse llamada, mostrando modal');
          setMostrarConfirmacionRendirse(true);
        }}
        hayMovimientoPendiente={!!state.movimientoPendiente}
        tablasOfrecidas={state.tablasOfrecidas}
        solicitadasTablas={state.solicitadasTablas}
      />

      {/* Modal de promoción */}
      <ModalPromocion
        visible={state.mostrarPromocion}
        onPromocion={async (tipo) => {
          try {
            await actions.promocionarPeon(tipo);
          } catch (err) {
            console.error('Error en promocion:', err);
          }
        }}
      />

      {/* Modal de tablas ofrecidas */}
      <ModalConfirmacion
        visible={state.tablasOfrecidas}
        titulo="Tablas Ofrecidas"
        mensaje={`${state.nombreOponente || 'El oponente'} ofrece tablas. ¿Aceptas?`}
        onConfirmar={() => actions.solicitarTablas()}
        onCancelar={() => actions.retirarTablas()}
      />

      {/* Modal de fin de partida */}
      <ModalFinPartida
        visible={state.mostrarFinPartida}
        resultado={mensajeResultado(String(state.partida.resultado ?? ''), state.miColor)}
        tipo={mensajeFinPartida(String(state.partida.tipoFin ?? ''))}
        onVolverAlMenu={volverAlMenu}
        onJugarDeNuevo={() => actions.solicitarReinicio()}
        onRetirarReinicio={() => actions.retirarReinicio()}
        oponenteAbandono={state.oponenteAbandono}
        solicitadoReinicio={state.solicitadoReinicio}
        oponenteSolicitoReinicio={state.oponenteSolicitoReinicio}
      />

      {/* Modal de confirmación de rendirse */}
      <ModalConfirmacion
        visible={mostrarConfirmacionRendirse}
        titulo="¿Rendirse?"
        mensaje="Una vez que te rindas, perderás la partida. ¿Estás seguro?"
        onConfirmar={() => {
          console.log('[PartidaScreen] Rendirse confirmado, llamando a actions.rendirse()');
          setMostrarConfirmacionRendirse(false);
          actions.rendirse();
        }}
        onCancelar={() => {
          console.log('[PartidaScreen] Rendirse cancelado');
          setMostrarConfirmacionRendirse(false);
        }}
      />
    </ScrollView>
  );
});

export default PartidaScreen;
