/**
 * Pantalla del Menú Principal
 */

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useMenuPrincipal } from '../hooks/useViewModels';
import { InputNombre, InputNombre as InputSala, Boton } from '../components/AjedrezComponents';

type RootStackParamList = {
  Identificacion: undefined;
  MenuPrincipal: { nombreJugador: string };
  Partida: { nombreJugador: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  estadoConexion: {
    fontSize: 14,
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  conectado: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  desconectado: {
    backgroundColor: '#F44336',
    color: '#fff',
  },
  conectando: {
    backgroundColor: '#FF9800',
    color: '#fff',
  },
  error: {
    color: '#F44336',
    marginVertical: 8,
    fontSize: 14,
  },
});

const HUB_URL = 'http://localhost:5000/ajedrezHub'; // Cambiar según tu servidor

export const MenuPrincipalScreen = observer(({ route, navigation }: Props) => {
  const { state, actions } = useMenuPrincipal();

  useEffect(() => {
    // Inicializar con el nombre del jugador
    const { nombreJugador } = route.params;
    actions.setNombreJugador(nombreJugador);
    
    // Conectar automáticamente
    actions.conectar(HUB_URL);

    return () => {
      // Limpiar al desmontar
      actions.desconectar();
    };
  }, []);

  // Observar si la partida fue creada
  useEffect(() => {
    if (state.partida) {
      // Navegar a la pantalla de partida
      navigation.navigate('Partida', { nombreJugador: state.nombreJugador });
    }
  }, [state.partida]);

  // Observar cambios en esperandoOponente
  useEffect(() => {
    if (state.esperandoOponente) {
      Alert.alert(
        'Sala Creada',
        `Esperando al oponente en la sala: ${state.nombreSala}`
      );
    }
  }, [state.esperandoOponente]);

  const getEstadoConexionStyle = () => {
    switch (state.connectionState) {
      case 'Connected':
        return estilos.conectado;
      case 'Connecting':
      case 'Reconnecting':
        return estilos.conectando;
      default:
        return estilos.desconectado;
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      {/* Encabezado */}
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Menú Principal</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Bienvenido, {state.nombreJugador}
        </Text>
      </View>

      {/* Estado de conexión */}
      <Text style={[estilos.estadoConexion, getEstadoConexionStyle()]}>
        {state.connectionState === 'Connected'
          ? '🟢 Conectado'
          : state.connectionState === 'Connecting' || state.connectionState === 'Reconnecting'
          ? '🟡 Conectando...'
          : '🔴 Desconectado'}
      </Text>

      {/* Mensaje de error */}
      {state.error && <Text style={estilos.error}>{state.error}</Text>}

      {/* Esperar oponente */}
      {state.esperandoOponente && (
        <View style={[estilos.card, { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color="#2196F3" />
            <Text style={{ flex: 1, color: '#2196F3', fontWeight: '600' }}>
              Esperando al oponente...
            </Text>
          </View>
        </View>
      )}

      {/* Crear Sala */}
      <Text style={estilos.subtitulo}>Crear Nueva Sala</Text>
      <View style={estilos.card}>
        <InputSala
          value={state.nombreSala}
          onChangeText={actions.setNombreSala}
          placeholder="Nombre de la sala"
          isLoading={state.isLoading}
        />
        <Boton
          title="Crear Sala"
          onPress={actions.crearSala}
          loading={state.isLoading}
          disabled={!state.nombreSala.trim() || state.connectionState !== 'Connected'}
        />
      </View>

      {/* Unirse a Sala */}
      <Text style={estilos.subtitulo}>Unirse a Sala Existente</Text>
      <View style={estilos.card}>
        <InputSala
          value={state.nombreSala}
          onChangeText={actions.setNombreSala}
          placeholder="Nombre de la sala"
          isLoading={state.isLoading}
        />
        <Boton
          title="Unirse a Sala"
          onPress={actions.unirseSala}
          loading={state.isLoading}
          disabled={!state.nombreSala.trim() || state.connectionState !== 'Connected'}
        />
      </View>

      {/* Botón desconectar */}
      <Boton
        title="Desconectar"
        onPress={actions.desconectar}
        loading={state.isLoading}
        style={{ backgroundColor: '#F44336', marginTop: 24 }}
      />
    </ScrollView>
  );
});
