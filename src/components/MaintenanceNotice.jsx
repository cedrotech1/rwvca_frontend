export function MaintenanceNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#2f5d31]">RWVCA</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">Scheduled maintenance</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          The system will be offline for maintenance between 21:00 and 00:00 on 9 October 2026. Please finish your work before then. You can sign in again after midnight.
        </p>
        <p className="mt-5 rounded-xl bg-[#2f5d31]/10 px-4 py-3 text-sm font-medium text-[#2f5d31]">
          9 October 2026 · 21:00 – 00:00
        </p>
      </div>
    </div>
  );
}
