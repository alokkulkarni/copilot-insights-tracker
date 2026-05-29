import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { deriveEditorRows } from '../utils/dataHelpers.js';

const COLOURS = ['#E4003B', '#B8002E', '#ff4d6d', '#c9184a', '#ff758f', '#ff8fa3'];

function EditorBreakdownChart({ usageData }) {
  const rows = deriveEditorRows(usageData);

  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-state__icon" aria-hidden="true">📊</div>
        <p>No editor data available yet.</p>
      </div>
    );
  }

  const pieData = rows.map((r) => ({ name: r.editor, value: r.suggestions }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--colour-surface)',
            border: '1px solid var(--colour-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [value.toLocaleString(), 'Suggestions']}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default EditorBreakdownChart;
