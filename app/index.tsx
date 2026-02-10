// app/index.tsx
import '../src/core/registrations'; // registrar singletons antes de renderizar
import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/identificacion" />;
}
