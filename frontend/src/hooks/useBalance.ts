// Los hooks se utilizaron para leer el saldo de un usuario y para recargarlo. Se guardan en LocalStorage, todos empiezan con un saldo de 0. Se redondea a dos decimales para evitar problemas de precisión con los números de punto flotante.

import { useCallback, useState } from "react";
import { addBalance, getBalance } from "../services/walletService";

export function useBalance(userId: string) {
  const [balance, setBalance] = useState(() => getBalance(userId));

  // Suma al saldo: guarda en LocalStorage y refresca la pantalla.
  const credit = useCallback(
    (amount: number) => {
      setBalance(addBalance(userId, amount));
    },
    [userId]
  );

  return { balance, credit };
}