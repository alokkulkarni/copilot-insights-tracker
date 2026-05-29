import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { buildTrendData } from '../utils/dataHelpers.js';

function UsageTrendChart({ usageData, showAccepted = true }) {
  const chartData = buildTrendData(usageData);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-state__icon" aria-hidden="true">📊</div>
        <p>No trend data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--colour-border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--colour-text-muted)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--colour-text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--colour-surface)',
            border: '1px solid var(--colour-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="suggestions"
          stroke="var(--colour-primary)"
          strokeWidth={2}
          dot={false}
          name="Suggestions"
        />
        {showAccepted && (
          <Line
            type="monotone"
            dataKey="accepted"
            stroke="var(--colour-success)"
            strokeWidth={2}
            dot={false}
            name="Accepted"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default UsageTrendChart;
