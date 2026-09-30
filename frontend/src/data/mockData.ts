// Datos simulados para la app, las dos graficas salen de este mismo conjunto, asi que cuadraran.

export interface SimSnail {
  id: number;
  name: string;
}

export interface SimRace {
  id: number;
  time: string;
  winnerId: number;
}

export interface SimBet {
  id: number;
  raceId: number;
  snailId: number;
  amount: number;
}

export const SNAILS: SimSnail[] = [
  { id: 1, name: "Turbo" },
  { id: 2, name: "Babosa Veloz" },
  { id: 3, name: "Concha Ligera" },
  { id: 4, name: "Rayo Lento" },
  { id: 5, name: "Tortuguita" },
  { id: 6, name: "Gary" },
];

// Las seis carreras del día y quién ganó cada una.
export const RACES: SimRace[] = [
  { id: 1, time: "09:00", winnerId: 2 },
  { id: 2, time: "11:00", winnerId: 5 },
  { id: 3, time: "13:00", winnerId: 2 },
  { id: 4, time: "15:00", winnerId: 1 },
  { id: 5, time: "17:00", winnerId: 6 },
  { id: 6, time: "19:00", winnerId: 2 },
];

// Dos apuestas por carrera.
export const BETS: SimBet[] = [
  { id: 1, raceId: 1, snailId: 2, amount: 100 },
  { id: 2, raceId: 1, snailId: 4, amount: 50 },
  { id: 3, raceId: 2, snailId: 1, amount: 80 },
  { id: 4, raceId: 2, snailId: 5, amount: 120 },
  { id: 5, raceId: 3, snailId: 3, amount: 60 },
  { id: 6, raceId: 3, snailId: 6, amount: 40 },
  { id: 7, raceId: 4, snailId: 1, amount: 100 },
  { id: 8, raceId: 4, snailId: 2, amount: 70 },
  { id: 9, raceId: 5, snailId: 4, amount: 90 },
  { id: 10, raceId: 5, snailId: 6, amount: 50 },
  { id: 11, raceId: 6, snailId: 2, amount: 150 },
  { id: 12, raceId: 6, snailId: 3, amount: 60 },
];

// Cuenta cuántas apuestas se ganaron y cuántas se perdieron, comparando cada una con el ganador de su carrera.
export function getBetStats() {
  const winnerByRace = new Map(RACES.map((r) => [r.id, r.winnerId]));
  const won = BETS.filter((b) => winnerByRace.get(b.raceId) === b.snailId).length;
  return { won, lost: BETS.length - won };
}

// Cuenta cuántas de las 6 carreras ganó cada caracol.
export function getWinsBySnail() {
  return SNAILS.map((s) => ({
    name: s.name,
    wins: RACES.filter((r) => r.winnerId === s.id).length,
  }));
}