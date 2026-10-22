import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

// Set ENABLED to true during a planned outage. Login, admin, and the dashboard then show the card.
const ENABLED = true;
const START = new Date('2026-10-09T21:00:00+02:00');
const END = new Date('2026-10-10T00:00:00+02:00');

export function isMaintenanceWindow(now = new Date()) {
  if (!ENABLED) return false;
  return now >= START && now < END;
}

export function MaintenanceNotice({ force = false }) {
  const [visible, setVisible] = useState(() => force || isMaintenanceWindow());

  useEffect(() => {
    if (force) return undefined;
    const timer = setInterval(() => setVisible(isMaintenanceWindow()), 15000);
    return () => clearInterval(timer);
  }, [force]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-[#003500] via-[#2f5d31] to-[#472b1e] p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 bg-[#ffca28]" />
        <div className="px-8 pb-8 pt-8 text-center">
          <img src="/RWVCA_LOGO.png" alt="RWVCA" className="mx-auto h-24 w-auto" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b4423]">
            Rwanda Wood Value Chain Association
          </p>

          <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#2f5d31]/10 text-[#2f5d31]">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#003500]">System is offline</h1>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            The system is offline for maintenance until 00:00 tonight, 9 October 2026.
            Please come back after midnight.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl bg-[#2f5d31]/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b4423]">Date</p>
              <p className="mt-1 text-sm font-semibold text-[#003500]">9 October 2026</p>
            </div>
            <div className="rounded-xl bg-[#6b4423]/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b4423]">Time</p>
              <p className="mt-1 text-sm font-semibold text-[#003500]">21:00 – 00:00</p>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-500">Thank you for your patience.</p>
        </div>
      </div>
    </div>
  );
}
