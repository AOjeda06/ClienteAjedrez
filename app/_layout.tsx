// app/_layout.tsx
/**
 * Layout global con Expo Router
 * IMPORTANTE: importamos las registraciones una sola vez al arrancar.
 */

import '../src/core/registrations'; // <-- registra singletons UNA VEZ al arrancar
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
}
