# ClienteAjedrez - Cliente Móvil de Ajedrez

> Cliente React Native + TypeScript para jugar ajedrez en tiempo real con SignalR

![Ajedrez](https://img.shields.io/badge/Ajedrez-♔-blue) ![React Native](https://img.shields.io/badge/React%20Native-0.81-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## 🎮 Características

- **Juego Completo de Ajedrez**: Todas las reglas clásicas implementadas
- **Movimientos Legales**: Validación automática para todas las piezas
- **Enroque**: Corto y largo con validaciones
- **Captura al Paso**: Implementada
- **Promoción de Peón**: Modal interactivo
- **Jaque y Jaque Mate**: Detección automática
- **Interfaz Interactiva**: Tablero 8x8 con resaltado de movimientos
- **SignalR**: Comunicación en tiempo real con el servidor
- **Clean Architecture**: Código bien estructurado y mantenible

## 🚀 Inicio Rápido

### Requisitos
- Node.js v18+
- npm o yarn
- Expo CLI

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar URL del servidor
# Edita src/presentation/screens/MenuPrincipalScreen.tsx
# const HUB_URL = 'http://localhost:5000/ajedrezHub';

# Iniciar la aplicación
npm start
```

### Comandos Disponibles

```bash
# Iniciar Expo
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web

# Tests
npm test

# Linting
npm run lint
```

## 📁 Estructura del Proyecto

```
src/
├── core/
│   ├── types.ts              # Tipos globales
│   └── container.ts          # Inyección de dependencias
├── domain/
│   ├── entities/             # Lógica de negocio
│   ├── repositories/         # Interfaces
│   ├── usecases/             # Casos de uso
│   └── mappers/              # Conversiones
├── data/
│   ├── datasources/          # SignalR
│   ├── repositories/         # Implementaciones
│   └── mappers/              # Mappers de datos
└── presentation/
    ├── viewmodels/           # MobX state
    ├── screens/              # Pantallas
    ├── components/           # Componentes
    └── hooks/                # Hooks React
```

## 🎯 Funcionalidad Implementada

### ✅ Obligatoria (100%)
- [x] UI: Identificación → Menú → Partida
- [x] ViewModels con MobX
- [x] Lógica de movimientos completa
- [x] Enroque con validaciones
- [x] Captura al paso
- [x] Promoción de peón
- [x] Jaque/Jaque mate
- [x] Confirmación de movimientos
- [x] Deshacer movimiento
- [x] Tablas/Rendición/Reinicio
- [x] SignalR + Mappers
- [x] Clean Architecture
- [x] TypeScript estricto
- [x] Tests skeleton
- [x] Documentación

## 🔧 Configuración

### Servidor SignalR

Edita en `src/presentation/screens/MenuPrincipalScreen.tsx`:

```typescript
const HUB_URL = 'http://localhost:5000/ajedrezHub'; // Cambiar URL según servidor
```

### Variables de Entorno

Ver `.env.example` para configuración completa.

## 📡 API del Servidor

### Métodos Invocados
- `SetNombreJugador(nombre)`
- `CrearSala(nombre)`
- `UnirseSala(nombre)`
- `RealizarMovimiento(objeto)`
- `SolicitarTablas()`
- `Rendirse()`
- `PromocionarPeon(tipo)`

### Eventos Recibidos
- `SalaCreada`
- `JugadorUnido`
- `PartidaIniciada`
- `MovimientoRealizado`
- `TurnoActualizado`
- `JaqueActualizado`
- `PartidaFinalizada`

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests incluidos:
# - Validación de movimientos (Tablero)
# - Comportamiento de PartidaVM
# - Selección de piezas
# - Tablas y rendición
```

## 🎨 Tecnologías

- **React Native**: UI framework
- **TypeScript**: Type safety
- **MobX**: State management
- **SignalR**: Real-time communication
- **Expo**: Development platform
- **Jest**: Testing

## 📊 Decisiones de Arquitectura

### Clean Architecture
- `core`: Utilidades y tipos globales
- `domain`: Lógica de negocio sin dependencias externas
- `data`: Acceso a datos (SignalR)
- `presentation`: UI con MobX ViewModels

### Mappers
- `DomainMapper`: DTO → Entidad de dominio
- `DataMapper`: DTO de red → Entidad

### Inyección de Dependencias
- Contenedor simple en `core/container.ts`
- Singletons para DataSource, Repository, UseCase

## ⚙️ Notas de Implementación

### Detección de Jaque
Se simula el movimiento y se verifica si el rey sigue en jaque:
```typescript
private movimientoDejaEnJaque(pieza: Pieza, destino: Posicion): boolean {
  // Simular, verificar jaque, deshacer
}
```

### Movimientos Posibles
Se calculan para todas las piezas y se filtran los que dejan el rey en jaque:
```typescript
obtenerMovimientosPosibles(pieza: Pieza): Posicion[] {
  // Calcular según tipo
  // Filtrar que no dejen en jaque
}
```

### Enroque
Validaciones completas:
- Rey y torre no se han movido
- Casillas intermedias vacías
- Rey no está en jaque ni pasa por jaque

## 🐛 Manejo de Errores

Todos los errores se capturan y muestran al usuario:
```typescript
try {
  await accion();
} catch (error) {
  this.error = error.message;
  Alert.alert('Error', error.message);
}
```

## 📝 Logging

Incluye logging en consola para debugging:
```typescript
console.log('Conectando a SignalR...');
console.error('Error conectando:', error);
```

## 🚨 Limitaciones Conocidas

- ❌ Sin reloj de juego por turno
- ❌ Sin chat entre jugadores
- ❌ Sin análisis de partidas
- ❌ Sin estadísticas
- ❌ Sin revancha automática

## 🔄 Mejoras Futuras

1. **Optimización Visual**: Animaciones, efectos de sonido
2. **Sistema de Rating**: Elo rating
3. **Ligas/Torneos**: Competiciones
4. **Análisis**: Motor de ajedrez
5. **Seguridad**: Autenticación, anti-cheat
6. **Performance**: Memoización, caché

## 📚 Recursos

- [Reglas de Ajedrez](https://es.wikipedia.org/wiki/Ajedrez)
- [SignalR Docs](https://learn.microsoft.com/en-us/aspnet/core/signalr/)
- [MobX Docs](https://mobx.js.org/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

## 🎓 Curso

Proyecto desarrollado para el curso de **INTERFACES** - **TEMA 9: VideoJuego**

## 📄 Licencia

Copyright © 2024. Todos los derechos reservados.
