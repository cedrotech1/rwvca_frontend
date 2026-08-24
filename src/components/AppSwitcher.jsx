import { resolveHostelAppUrl } from '../utils/appPaths';

export const AppSwitcher = () => {
  const hostelUrl = resolveHostelAppUrl();
  const isUat = (import.meta.env.BASE_URL || '').includes('/uat/');

  return (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href={hostelUrl}
        className="group inline-flex items-center gap-2 rounded-lg border border-[#1e3c72]/20 bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-3 py-1.5 text-white shadow-sm transition hover:shadow-md hover:from-[#17325d] hover:to-[#1e3c72]"
        title="Return to Hostel application"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-xs font-bold">
          H
        </span>
        <span className="hidden sm:inline text-xs font-semibold tracking-wide uppercase">
          Hostel App
        </span>
      </a>

      <span
        className="inline-flex items-center gap-2 rounded-lg border border-[#2f5d31]/25 bg-[#eef7fb] px-3 py-1.5 text-[#2f5d31] shadow-sm"
        title="Student Welfare Activity Reporting System"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2f5d31] text-[10px] font-bold text-white">
          S
        </span>
        <span className="hidden sm:inline text-xs font-semibold tracking-wide uppercase">
          {isUat ? 'SWARS UAT' : 'SWARS'}
        </span>
      </span>
    </div>
  );
};
