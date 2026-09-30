
// Servicio para manejar el saldo de cada usuario. Se guarda en localStorage, todos empiezan con un saldo de 0
import {readJSON, writeJSON} from "../utils/storage";

export const INITIAL_BALANCE = 0;

const keyFor = (userId: string) => `caracoles:balance:${userId}`;
// Redondea a dos decimales, para evitar problemas de precisión con los números de punto flotante.
const round2 = (n:number) => Math.round(n * 100) / 100;

// si no hay saldo guardado se inicia con un saldo en 0
export function getBalance(userId: string): number {
const value = readJSON<number | null>(keyFor(userId), null);
return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : INITIAL_BALANCE;
}

// suma al saldo lo guardado y devuelve el nuevo saldo.
export function addBalance(userId: string, amount: number): number {
    const next = round2(getBalance(userId) + amount);
    writeJSON(keyFor(userId), next);
    return next;
}