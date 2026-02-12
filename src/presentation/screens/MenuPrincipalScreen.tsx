/**
 * src/presentation/screens/MenuPrincipalScreen.tsx
 * Componente observer que usa el viewModel directamente
 */

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useMenuPrincipal } from '../hooks/useViewModels';
import { InputNombre, Boton } from '../components/AjedrezComponents';

const HUB_URL: string = (() => {
  const url = process.env.EXPO_PUBLIC_HUB_URL;
  if (!url) {
    console.error(
      '[Config] EXPO_PUBLIC_HUB_URL no está definida. ' +
      'Añade EXPO_PUBLIC_HUB_URL=https://localhost:7040/ajedrezHub en tu .env ' +
      'y reinicia el servidor de desarrollo.'
    );
    return 'https://localhost:7040/ajedrezHub';
  }
  return url;
})();

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

export const MenuPrincipalScreen: React.FC = observer(() => {
  const { viewModel, actions } = useMenuPrincipal();

  const params = useLocalSearchParams<{ nombreJugador?: string }>();
  const router = useRouter();

  const nombreJugador =
    (params.nombreJugador ? String(params.nombreJugador) : null) ||
    viewModel.nombreJugador ||
    '';

  useEffect(() => {
    if (!nombreJugador.trim()) {
      console.warn('MenuPrincipal: no hay nombre de jugador.');
      return;
    }

    if (viewModel.nombreJugador !== nombreJugador) {
      actions.setNombreJugador(nombreJugador);
    }

    actions.conectar(HUB_URL).catch(err => {
      console.error('Error al conectar desde MenuPrincipal:', err);
    });

    // No cleanup needed - connection persists across navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombreJugador]);

  useEffect(() => {
    if (viewModel.partida) {
      router.push({
        pathname: '/partida',
        params: { nombreJugador },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewModel.partida]);

  const getEstadoConexionStyle = () => {
    switch (viewModel.connectionState) {
      case 'Connected':    return estilos.conectado;
      case 'Connecting':
      case 'Reconnecting': return estilos.conectando;
      default:             return estilos.desconectado;
    }
  };

  const isConnected = viewModel.connectionState === 'Connected';

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Menú Principal</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Bienvenido, {nombreJugador || '—'}
        </Text>
      </View>

      <Text style={[estilos.estadoConexion, getEstadoConexionStyle()]}>
        {viewModel.connectionState === 'Connected'
          ? '🟢 Conectado'
          : viewModel.connectionState === 'Connecting' || viewModel.connectionState === 'Reconnecting'
          ? '🟡 Conectando...'
          : '🔴 Desconectado'}
      </Text>

      {viewModel.error && <Text style={estilos.error}>{viewModel.error}</Text>}

      {viewModel.esperandoOponente && (
        <View style={[estilos.card, { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color="#2196F3" />
            <Text style={{ flex: 1, color: '#2196F3', fontWeight: '600' }}>
              Esperando al oponente...
            </Text>
          </View>
        </View>
      )}

      {/* Crear sala */}
      <Text style={estilos.subtitulo}>Crear Nueva Sala</Text>
      <View style={estilos.card}>
        <InputNombre
          value={viewModel.nombreSalaCrear}
          onChangeText={(t) => actions.setNombreSalaCrear(t)}
          placeholder="Nombre de la sala"
          isLoading={viewModel.isLoading}
        />
        <Boton
          title="Crear Sala"
          onPress={async () => {
            try {
              await actions.crearSala();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'No se pudo crear la sala');
            }
          }}
          loading={viewModel.isLoading}
          disabled={!viewModel.nombreSalaCrear.trim() || !isConnected}
        />
      </View>

      {/* Unirse a sala */}
      <Text style={estilos.subtitulo}>Unirse a Sala Existente</Text>
      <View style={estilos.card}>
        <InputNombre
          value={viewModel.nombreSalaUnirse}
          onChangeText={(t) => actions.setNombreSalaUnirse(t)}
          placeholder="Nombre de la sala"
          isLoading={viewModel.isLoading}
        />
        <Boton
          title="Unirse a Sala"
          onPress={async () => {
            try {
              await actions.unirseSala();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'No se pudo unir a la sala');
            }
          }}
          loading={viewModel.isLoading}
          disabled={!viewModel.nombreSalaUnirse.trim() || !isConnected}
        />
      </View>

      {/* Cambiar nombre de usuario */}
      <Boton
        title="Cambiar nombre de usuario"
        onPress={() => {
          router.replace('/identificacion');
        }}
        style={{ backgroundColor: '#FF9800', marginTop: 24 }}
      />
    </ScrollView>
  );
});

export default MenuPrincipalScreen;
