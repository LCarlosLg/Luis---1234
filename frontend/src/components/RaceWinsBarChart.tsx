// Barras con las victorias de cada caracol en el día simulado, El eje Y va de 0 a 6 (el número de carreras) y solo con enteros, porque no existen victorias a medias.

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RACES, getWinsBySnail } from "../data/mockData";

export function RaceWinsBarChart() {
  const data = getWinsBySnail();

  return (
    <section className="panel">
      <h2>Victorias por caracol</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} domain={[0, RACES.length]} />
          <Tooltip />
          <Bar dataKey="wins" name="Victorias" fill="#2f7d4f" />
        </BarChart>
      </ResponsiveContainer>
      <p className="hint">Día simulado: {RACES.length} carreras.</p>
    </section>
  );
}