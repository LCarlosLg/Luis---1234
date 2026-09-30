//Pide al backend que cargue saldo a través de la simulación con snailPay

import {request} from "./apiClient";

export interface SnailPayCharge {
    transactionId: string;
    amount: number;
    status: "approved";
    processedAt: string;
}

//Solo se resuelve si el cobro fue aprobado. Si no, el backend devuelve un error que request() convierte en ApiError.
export const chargeSnailPay= (amount: number) =>
    request<SnailPayCharge>("/snailpay/charges", {
        method: "POST",
        body: JSON.stringify({ amount })
    }); 