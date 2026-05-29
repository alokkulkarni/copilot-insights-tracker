function StatCard({ icon, value, label, change }) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-card__icon" aria-hidden="true">{icon}</div>}
      <div className="stat-card__value">{value ?? '—'}</div>
      <div className="stat-card__label">{label}</div>
      {change != null && (
        <div className={`stat-card__change ${change >= 0 ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}

export default StatCard;
