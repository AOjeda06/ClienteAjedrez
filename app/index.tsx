/**
 * Punto de entrada de la aplicación
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirige a la pantalla de identificación
  return <Redirect href="/identificacion" />;
}
