# TODO: Fix Chess Game Issues

## Completed Tasks
- [x] Modify `realizarMovimientoLocal` in PartidaVM to apply moves locally without changing turn
- [x] Add timer implementation in PartidaVM to increment `tiempoTranscurrido` every second
- [x] Ensure button actions call correct server methods
- [x] Fix MobX strict mode issues by wrapping state changes in runInAction
- [x] Add console logs for tracing app flow
- [x] Fix turn message to show "Turno del oponente" instead of room name

## Pending Tasks
- [x] Wrap all observable state changes in runInAction to fix MobX strict mode errors
- [x] Update turn message to show player names instead of "Tu turno" / "Turno del oponente"
- [x] Fix tablas buttons by updating hub to call use cases
- [x] Fix movement turn updates by ensuring turno is sent after moves
- [ ] Test movement flow after fixes
- [ ] Test timer real-time update
- [ ] Verify button actions work
