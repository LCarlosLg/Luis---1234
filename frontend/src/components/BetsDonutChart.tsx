// Donut de apuestas ganadas vs. perdidas. En realidad es una gráfica de pastel (PieChart) con `innerRadius`, que es lo que le abre el hueco.
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getBetStats } from "../data/mockData";

export function BetsDonutChart() {
  const { won, lost } = getBetStats();
  const data = [
    { name: "Ganadas", value: won, color: "#2f7d4f" },
    { name: "Perdidas", value: lost, color: "#c0392b" },
  ];

  return (
    <section className="panel">
      <h2>Apuestas ganadas y perdidas</h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="hint">Total simulado: {won + lost} apuestas.</p>
    </section>
  );
}