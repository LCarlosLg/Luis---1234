// Tarjeta que muestra el saldo actual. Se usa en la pantalla de inicio y en la de resultados, se muestra en moneda mexicana (MXN)

export function BalanceCard({ balance }: { balance: number }) {
    return(
        <section className="panel">
            <h2>Saldo actual</h2>
                  <p className="balance">{balance.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</p>
    </section>
  );
}