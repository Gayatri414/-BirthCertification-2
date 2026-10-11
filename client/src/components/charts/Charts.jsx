import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATUS_COLORS, STATUS_META } from '../../utils/constants';

const axis = { fontSize: 12, fill: '#64748b' };

// bars: [{ key, name, color }]. Set horizontal for long category labels (hospital names).
export function BarSeries({ data, xKey, bars, horizontal = false }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 8, left: horizontal ? 8 : -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!horizontal} vertical={horizontal} />
        {horizontal
          ? (<><XAxis type="number" allowDecimals={false} tick={axis} /><YAxis type="category" dataKey={xKey} width={110} tick={axis} /></>)
          : (<><XAxis dataKey={xKey} tick={axis} /><YAxis allowDecimals={false} tick={axis} /></>)}
        <Tooltip cursor={{ fill: 'rgba(99,102,241,.06)' }} />
        {bars.length > 1 && <Legend iconType="circle" />}
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} maxBarSize={36} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

// data: [{ status, value }]
export function StatusPie({ data }) {
  const rows = data.map((d) => ({ name: STATUS_META[d.status]?.label || d.status, value: d.value, color: STATUS_COLORS[d.status] || '#94a3b8' }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>
          {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
        </Pie>
        <Tooltip /><Legend verticalAlign="bottom" iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
