import Button from '../../components/ui/Button';

const stats = [
  { label: 'Active glossary terms', value: '47' },
  { label: 'Terms applied this month', value: '1,234' },
  { label: 'Pending suggestions', value: '3' },
  { label: 'Reviews completed', value: '28' },
];

const recentActivity = [
  { action: 'Term approved', detail: '"blood pressure" \u2192 "presyon sa dugo" (medical)', time: '2h ago' },
  { action: 'Review completed', detail: '3 translations reviewed', time: '5h ago' },
  { action: 'Suggestion submitted', detail: '"deductible" in Hmong', time: '1d ago' },
  { action: 'Term approved', detail: '"school district" \u2192 "distrito ng paaralan" (education)', time: '2d ago' },
  { action: 'Flag resolved', detail: '"emergency room" — flag reviewed, term updated', time: '3d ago' },
];

export default function OrgDashboard() {
  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <div className="text-sm text-text-secondary">
          Community Health Partners
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-1 border border-border rounded-lg p-6">
            <p className="text-xs text-text-secondary uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-bold text-text-primary mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent activity</h2>
        <div className="space-y-2">
          {recentActivity.map((item, i) => (
            <div key={i} className="bg-surface-1 border border-border rounded-lg p-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.action}</p>
                <p className="text-xs text-text-secondary mt-0.5">{item.detail}</p>
              </div>
              <span className="text-xs text-text-tertiary shrink-0 ml-4">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
