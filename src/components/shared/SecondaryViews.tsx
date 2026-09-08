import {
  FileCheck,
  Bookmark,
  TrendingUp,
  User,
  Settings,
  Sparkles,
  MapPin,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { MOCK_JOBS } from '../../services/mockJobs';
import { formatSalary, getMatchScoreColor } from '../../utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function ApplicationsView() {
  const appliedJobs = useJobStore((state) => state.appliedJobs);
  const setSelectedJobId = useJobStore((state) => state.setSelectedJobId);
  const setActiveNav = useJobStore((state) => state.setActiveNav);

  const appliedList = Object.values(appliedJobs);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Active Job Applications
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track real-time status and recruiter screening for your submitted positions
        </p>
      </div>

      {appliedList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No active applications yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse the split-view job feed and click &ldquo;Quick Apply&rdquo; or press &lsquo;A&rsquo; to submit in 1-click.
          </p>
          <Button onClick={() => setActiveNav('jobs')} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {appliedList.map((app) => {
            const job = MOCK_JOBS.find((j) => j.id === app.jobId);
            if (!job) return null;

            return (
              <div
                key={app.jobId}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs ${job.companyLogoBg}`}
                  >
                    {job.companyLogoText}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.company} • Applied on {app.appliedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Status: {app.status}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setActiveNav('jobs');
                    }}
                  >
                    View Role
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardInsightsView() {
  const setActiveNav = useJobStore((state) => state.setActiveNav);

  const stats = [
    { label: 'Profile Visibility', value: '98.4%', change: '+12% this week', icon: TrendingUp },
    { label: 'Median Tech Salary', value: '$225,000', change: 'Tier 1 tech baseline', icon: DollarSign },
    { label: 'Interview Match Rate', value: '4.8x', change: 'Above industry avg', icon: Sparkles },
    { label: 'Verified Skills Stack', value: '14 Skills', change: 'React, TypeScript, Rust', icon: ShieldCheck },
  ];

  const topSkills = [
    { name: 'React 19 & Next.js', demand: '98% match in 6 roles', trend: 'High' },
    { name: 'TypeScript (Strict)', demand: '100% match in 8 roles', trend: 'Critical' },
    { name: 'TanStack Query', demand: '88% match in 5 roles', trend: 'Surging' },
    { name: 'Tailwind CSS v4', demand: '92% match in 7 roles', trend: 'High' },
    { name: 'Distributed Systems', demand: '84% match in 4 roles', trend: 'Emerging' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Career Insights & Market Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time compensation benchmarks and skill demand trends across vetted tech leaders
          </p>
        </div>
        <Button onClick={() => setActiveNav('jobs')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Explore Matched Roles
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{s.label}</span>
                <Icon className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {s.value}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skill Demand Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
          Your High-Demand Skill Match Matrix
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {topSkills.map((skill, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {skill.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">{skill.demand}</span>
              <Badge variant="indigo" className="text-[10px]">
                {skill.trend}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileView() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Talent Profile & Verified Credentials
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Your profile is automatically matched with open hiring manager searches
        </p>
      </div>

      {/* Identity Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <div className="h-20 w-20 rounded-full ring-4 ring-indigo-500/20 overflow-hidden shrink-0">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
            alt="Alex Vance"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Alex Vance
            </h3>
            <Badge variant="success">Verified Candidate</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Staff Frontend Engineer • San Francisco, CA & Remote
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 pt-1">
            Specializing in high-performance split-views, design system engineering, and 60fps micro-interactions in React 19 and Next.js.
          </p>
        </div>
      </div>

      {/* Verified Skills */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Verified Core Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'React 18/19',
            'TypeScript (Strict)',
            'Next.js (App Router)',
            'Tailwind CSS v4',
            'Framer Motion',
            'Zustand',
            'TanStack Query',
            'View Transitions API',
            'Accessibility (WCAG AA)',
            'Performance Profiling',
          ].map((s) => (
            <span
              key={s}
              className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const theme = useJobStore((state) => state.theme);
  const setTheme = useJobStore((state) => state.setTheme);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Application Preferences & Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure search thresholds, theme, and instant notifications
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-sm shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Appearance Theme
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              Current mode: {theme}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              System
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Split View Keyboard Shortcuts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enable J / K navigation and A (Apply) shortcut
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Enabled
          </span>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Salary Privacy Masking
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Display transparent compensation bands on all listings
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Transparent
          </span>
        </div>
      </div>
    </div>
  );
}
