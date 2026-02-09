/**
 * Pantalla de Identificación
 */

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useIdentificacion } from '../hooks/useViewModels';
import { InputNombre, Boton } from '../components/AjedrezComponents';

type RootStackParamList = {
  Identificacion: undefined;
  MenuPrincipal: { nombreJugador: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Identificacion'>;

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2196F3',
  },
  subtitulo: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
});

export const IdentificacionScreen = observer(({ navigation }: Props) => {
  const { state, actions } = useIdentificacion();

  const handleContinuar = async () => {
    if (actions.validarYContinuar()) {
      actions.setLoading(true);
      // Simular pequeño delay
      setTimeout(() => {
        navigation.navigate('MenuPrincipal', { nombreJugador: state.nombreJugador });
        actions.setLoading(false);
      }, 500);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <View>
        <View style={{ marginBottom: 40 }}>
          <View style={{ fontSize: 64, textAlign: 'center', marginBottom: 20 }}>
            ♔ ♕ ♖ ♗ ♘ ♙
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <View style={{ fontSize: 28, marginBottom: 16 }}>
            <View style={estilos.titulo}>⚔️ ClienteAjedrez</View>
          </View>
          <View style={estilos.subtitulo}>
            Ingresa tu nombre para comenzar a jugar
          </View>
        </View>

        <InputNombre
          value={state.nombreJugador}
          onChangeText={actions.setNombre}
          placeholder="Tu nombre"
          error={state.error || undefined}
          isLoading={state.isLoading}
        />

        <Boton
          title="Continuar"
          onPress={handleContinuar}
          loading={state.isLoading}
          disabled={!state.nombreJugador.trim()}
        />
      </View>
    </ScrollView>
  );
});
