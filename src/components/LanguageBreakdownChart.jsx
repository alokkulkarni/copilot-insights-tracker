import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { deriveLanguageRows } from '../utils/dataHelpers.js';

const COLOURS = [
  '#E4003B', '#B8002E', '#ff4d6d', '#c9184a',
  '#ff758f', '#ff8fa3', '#ffb3c1', '#ffccd5',
];

function LanguageBreakdownChart({ usageData }) {
  const rows = deriveLanguageRows(usageData).slice(0, 8);

  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-state__icon" aria-hidden="true">📊</div>
        <p>No language data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--colour-border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'var(--colour-text-muted)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="language"
          tick={{ fontSize: 11, fill: 'var(--colour-text-muted)' }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--colour-surface)',
            border: '1px solid var(--colour-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value, name) => [value.toLocaleString(), name === 'suggestions' ? 'Suggestions' : 'Accepted']}
        />
        <Bar dataKey="suggestions" name="Suggestions" radius={[0, 4, 4, 0]}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default LanguageBreakdownChart;
