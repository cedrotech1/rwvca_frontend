import { LayoutDashboard } from 'lucide-react';

export const DashboardWelcome = ({ userName = 'User', subtitle, roleLabel, filters }) => (
  <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a1e] via-[#2f5d31] to-[#1e3a1e] shadow-lg">
    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
    <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/5" />
    <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-56 -translate-x-1/2 rounded-full bg-white/[0.03] blur-2xl" />

    <div className="relative px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            {roleLabel && (
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                {roleLabel}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
            Hi, {userName}! Welcome back
          </h1>
          <p className="mt-1 text-sm text-white/60 max-w-2xl">
            {subtitle || 'Here is your RWVCA dashboard — the modules you manage, and your own records.'}
          </p>
        </div>

        {filters && (
          <div className="shrink-0">{filters}</div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardWelcome;
