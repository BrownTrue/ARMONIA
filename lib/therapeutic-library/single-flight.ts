export type SingleFlightGate = { current: boolean };

export function acquireSingleFlight(gate: SingleFlightGate) {
  if (gate.current) return false;
  gate.current = true;
  return true;
}

export function releaseSingleFlight(gate: SingleFlightGate) {
  gate.current = false;
}
