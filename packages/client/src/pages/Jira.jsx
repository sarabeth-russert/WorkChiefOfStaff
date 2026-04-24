import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Input } from '../components/ui';
import useJiraStore from '../stores/jiraStore';
import CreateIssueModal from '../components/jira/CreateIssueModal';
import IssueCard from '../components/jira/IssueCard';

// Column definitions — themed workflow states with accent colors and empty-state copy
const COLUMNS = [
  { status: 'To Do', label: 'Open', subtitle: 'Active Missions', accent: 'terracotta', empty: 'No active missions on deck.' },
  { status: 'Backlog', label: 'Backlog', subtitle: 'Pending Briefings', accent: 'mustard', empty: 'All briefings have been reviewed.' },
  { status: 'In Progress', label: 'In Progress', subtitle: 'Field Operations', accent: 'sunset', empty: 'No operations underway.' },
  { status: 'In Review', label: 'In Review', subtitle: 'Under Examination', accent: 'teal', empty: 'No missions awaiting review.' },
  { status: 'Done', label: 'Filed', subtitle: 'Archived Reports', accent: 'jungle', empty: 'No recently filed reports.' },
];

// Tailwind requires static class names — map accent tokens to real classes
const ACCENT = {
  terracotta: { bar: 'bg-terracotta', text: 'text-terracotta' },
  mustard:    { bar: 'bg-mustard',    text: 'text-mustard' },
  sunset:     { bar: 'bg-sunset',     text: 'text-sunset' },
  teal:       { bar: 'bg-teal',       text: 'text-teal' },
  jungle:     { bar: 'bg-jungle',     text: 'text-jungle' },
};

const Jira = () => {
  const { issues, loading, error, fetchIssues, clearError } = useJiraStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const CONTECH_PROJECT = 'CONTECH';

  useEffect(() => {
    fetchIssues(CONTECH_PROJECT, { myIssuesOnly: true });
  }, []);

  // ── Filtered issues ──────────────────────────────────────
  const filteredIssues = useMemo(() => {
    if (!searchQuery) return issues;
    const q = searchQuery.toLowerCase();
    return issues.filter(issue =>
      issue.key.toLowerCase().includes(q) ||
      issue.fields.summary.toLowerCase().includes(q)
    );
  }, [issues, searchQuery]);

  // ── Kanban buckets ───────────────────────────────────────
  const { buckets, extraBuckets } = useMemo(() => {
    const b = {};
    COLUMNS.forEach(col => { b[col.status] = []; });
    const extras = {};

    filteredIssues.forEach(issue => {
      const status = issue.fields.status?.name || 'No Status';
      if (b[status]) {
        b[status].push(issue);
      } else {
        if (!extras[status]) extras[status] = [];
        extras[status].push(issue);
      }
    });

    return { buckets: b, extraBuckets: extras };
  }, [filteredIssues]);

  // Build renderable column list (defined columns + any unexpected statuses)
  const allColumns = [
    ...COLUMNS.map(col => ({ ...col, issues: buckets[col.status] })),
    ...Object.entries(extraBuckets).map(([status, items]) => ({
      status,
      label: status,
      subtitle: '',
      accent: 'teal',
      empty: `No issues with status "${status}".`,
      issues: items,
    })),
  ];

  // ── Telemetry computations ───────────────────────────────
  const telemetry = useMemo(() => {
    const active = issues.filter(i => i.fields.status?.name !== 'Done').length;
    const review = issues.filter(i => i.fields.status?.name === 'In Review').length;
    const filed = issues.filter(i => i.fields.status?.name === 'Done').length;
    const total = issues.length;

    // Aging: not updated in 7+ days, excluding Done
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const aging = issues.filter(i =>
      i.fields.status?.name !== 'Done' &&
      new Date(i.fields.updated).getTime() < sevenDaysAgo
    ).length;

    // Blockers: highest/critical priority, not done
    const blockers = issues.filter(i => {
      const p = (i.fields.priority?.name || '').toLowerCase();
      return i.fields.status?.name !== 'Done' && (p.includes('highest') || p.includes('critical'));
    }).length;

    const inProgress = issues.filter(i => i.fields.status?.name === 'In Progress').length;

    // Recent signals — 5 most recently updated
    const recentSignals = [...issues]
      .sort((a, b) => new Date(b.fields.updated) - new Date(a.fields.updated))
      .slice(0, 5);

    // Priority queue — top 3 highest-priority non-done issues
    const pw = (name) => {
      const p = (name || '').toLowerCase();
      if (p.includes('highest') || p.includes('critical')) return 0;
      if (p.includes('high')) return 1;
      if (p.includes('medium')) return 2;
      return 3;
    };
    const priorityQueue = issues
      .filter(i => i.fields.status?.name !== 'Done')
      .sort((a, b) => pw(a.fields.priority?.name) - pw(b.fields.priority?.name))
      .slice(0, 3);

    return { active, review, filed, total, aging, blockers, inProgress, recentSignals, priorityQueue };
  }, [issues]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Panoramic banner */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage">
        <img
          src="/images/pages/jira-header.png"
          alt="Field Assignments dispatch board"
          className="w-full h-52 md:h-72 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
        <div className="absolute top-4 left-4">
          <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
            Mission Tracking
          </span>
        </div>
      </div>

      {/* Title block */}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
          Field Assignments
        </h1>
        <p className="font-serif text-vintage-text/50 text-base italic">
          Expedition logistics &amp; mission tracking — CONTECH operations
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-center justify-between">
            <p className="text-terracotta-dark text-sm">
              <strong>Signal Failure:</strong> {error}
            </p>
            <Button variant="ghost" size="sm" onClick={clearError}>Dismiss</Button>
          </div>
        </Card>
      )}

      {/* Search / Create — expedition logistics strip */}
      <div className="flex gap-3 items-center border-2 border-sand-dark/30 rounded-lg bg-cream/40 px-4 py-3">
        <span className="font-ui text-xs uppercase tracking-widest text-vintage-text/50 whitespace-nowrap hidden sm:block">
          Mission Search
        </span>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by key or summary..."
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="whitespace-nowrap"
        >
          + Issue Permit
        </Button>
      </div>

      {/* Main layout: kanban + telemetry sidebar */}
      <div className="flex gap-6">
        {/* ── Kanban board ── */}
        <div className="flex-1 min-w-0">
          {loading && issues.length === 0 ? (
            <Card>
              <p className="text-center text-vintage-text py-8 font-serif italic">
                Receiving field transmissions...
              </p>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {allColumns.map((col) => {
                const a = ACCENT[col.accent] || ACCENT.teal;
                return (
                  <div
                    key={col.status}
                    className="flex-shrink-0 w-72 bg-cream/60 rounded-lg border border-sand-dark/30 flex flex-col"
                  >
                    {/* Column header */}
                    <div className="px-4 pt-4 pb-3">
                      <div className={`h-1 w-12 rounded-full mb-3 ${a.bar}`} />
                      <h3 className="text-lg font-poster text-vintage-text uppercase tracking-wide leading-none">
                        {col.label}
                      </h3>
                      {col.subtitle && (
                        <p className="font-serif text-xs text-vintage-text/40 italic mt-0.5">
                          {col.subtitle}
                        </p>
                      )}
                      <p className={`font-ui text-xs mt-1 ${a.text} opacity-70`}>
                        {col.issues.length} issue{col.issues.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Column body */}
                    <div className="px-3 pb-3 flex-1 space-y-2.5 min-h-[120px]">
                      {col.issues.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[100px]">
                          <p className="text-xs font-serif text-vintage-text/30 italic text-center px-4">
                            {col.empty}
                          </p>
                        </div>
                      ) : (
                        col.issues.map((issue) => (
                          <IssueCard key={issue.id} issue={issue} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Mission Telemetry sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0">
          {/* Stats */}
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 p-4">
            <h4 className="font-poster text-sm uppercase tracking-widest text-vintage-text/60 mb-3">
              Mission Telemetry
            </h4>
            <div className="space-y-2.5">
              {[
                { label: 'Active Missions', value: telemetry.active, color: 'text-terracotta' },
                { label: 'Awaiting Review', value: telemetry.review, color: 'text-teal' },
                { label: 'Overdue Signals', value: telemetry.aging, color: telemetry.aging > 0 ? 'text-terracotta-dark' : 'text-vintage-text/50' },
                { label: 'Recently Filed', value: telemetry.filed, color: 'text-jungle' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="font-ui text-xs uppercase tracking-wide text-vintage-text/60">{stat.label}</span>
                  <span className={`font-mono text-sm font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expedition Health */}
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 p-4">
            <h4 className="font-poster text-sm uppercase tracking-widest text-vintage-text/60 mb-3">
              Expedition Health
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Throughput', value: telemetry.total > 0 ? Math.round((telemetry.filed / telemetry.total) * 100) : 0, pct: true, color: 'bg-jungle' },
                { label: 'Aging Risk', value: telemetry.aging, pct: false, color: telemetry.aging > 2 ? 'bg-terracotta' : 'bg-mustard' },
                { label: 'Blockers', value: telemetry.blockers, pct: false, color: telemetry.blockers > 0 ? 'bg-terracotta-dark' : 'bg-jungle' },
                { label: 'Focus Load', value: telemetry.inProgress, pct: false, color: 'bg-teal' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-ui text-[10px] uppercase tracking-wide text-vintage-text/50">{m.label}</span>
                    <span className="font-mono text-xs text-vintage-text/70">
                      {m.value}{m.pct ? '%' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 bg-sand-dark/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color} transition-all`}
                      style={{
                        width: `${Math.min(
                          m.pct ? m.value : (telemetry.active > 0 ? (m.value / telemetry.active) * 100 : 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Signals */}
          <div className="bg-cream/60 rounded-lg border border-sand-dark/30 p-4">
            <h4 className="font-poster text-sm uppercase tracking-widest text-vintage-text/60 mb-3">
              Recent Signals
            </h4>
            {telemetry.recentSignals.length === 0 ? (
              <p className="text-xs font-serif text-vintage-text/30 italic">No recent transmissions.</p>
            ) : (
              <div className="space-y-2">
                {telemetry.recentSignals.map(issue => (
                  <div key={issue.id} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-teal mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-terracotta">{issue.key}</p>
                      <p className="text-xs text-vintage-text/70 truncate">{issue.fields.summary}</p>
                      <p className="text-[10px] text-vintage-text/30 font-ui">
                        {new Date(issue.fields.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Queue */}
          {telemetry.priorityQueue.length > 0 && (
            <div className="bg-cream/60 rounded-lg border border-sand-dark/30 p-4">
              <h4 className="font-poster text-sm uppercase tracking-widest text-vintage-text/60 mb-3">
                Priority Queue
              </h4>
              <div className="space-y-2">
                {telemetry.priorityQueue.map(issue => {
                  const p = (issue.fields.priority?.name || '').toLowerCase();
                  const dot = p.includes('highest') || p.includes('critical') ? 'bg-terracotta-dark'
                    : p.includes('high') ? 'bg-terracotta'
                    : 'bg-mustard';
                  return (
                    <div key={issue.id} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${dot} mt-1 flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-vintage-text font-serif truncate">{issue.fields.summary}</p>
                        <p className="font-mono text-[10px] text-vintage-text/40">{issue.key}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          projectKey={CONTECH_PROJECT}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchIssues(CONTECH_PROJECT, { myIssuesOnly: true });
          }}
        />
      )}
    </div>
  );
};

export default Jira;
