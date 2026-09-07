import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { NOTIFICATION_PRIORITIES, notificationPriorityMeta } from '../../utils/notificationPriority';

/**
 * Modal for choosing notification priority before send/submit.
 */
export function NotifyPriorityModal({
  open,
  title = 'Send notification as',
  subtitle = 'Choose how urgent this notification should appear for recipients.',
  confirmLabel = 'Send & notify',
  cancelLabel = 'Cancel',
  saving = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const [priority, setPriority] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <form
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl ring-1 ring-gray-100"
        onSubmit={(event) => {
          event.preventDefault();
          if (!priority) return;
          onConfirm?.(priority);
        }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-[#2f5d31]/10 p-2 text-[#2f5d31]">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-gray-700">Notify priority *</legend>
          {NOTIFICATION_PRIORITIES.map((item) => {
            const meta = notificationPriorityMeta(item.value);
            const selected = priority === item.value;
            return (
              <label
                key={item.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                  selected ? `${meta.row || 'bg-sky-50'} border-[#2f5d31]` : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="notify_priority"
                  className="mt-1"
                  checked={selected}
                  onChange={() => setPriority(item.value)}
                  required
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta.className}`}>
                      {item.label}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{item.hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
            onClick={() => {
              setPriority('');
              onCancel?.();
            }}
            disabled={saving}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={saving || !priority}
            className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Sending...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Imperative helper: open modal and resolve with selected priority (or null if cancelled).
 */
export function useNotifyPriorityModal() {
  const [state, setState] = useState({
    open: false,
    title: undefined,
    subtitle: undefined,
    confirmLabel: undefined,
    saving: false,
    error: '',
    resolve: null,
  });

  const askNotifyPriority = (options = {}) => new Promise((resolve) => {
    setState({
      open: true,
      title: options.title,
      subtitle: options.subtitle,
      confirmLabel: options.confirmLabel,
      saving: false,
      error: '',
      resolve,
    });
  });

  const close = (value) => {
    setState((prev) => {
      prev.resolve?.(value);
      return { ...prev, open: false, resolve: null, saving: false, error: '' };
    });
  };

  const modal = (
    <NotifyPriorityModal
      open={state.open}
      title={state.title}
      subtitle={state.subtitle}
      confirmLabel={state.confirmLabel}
      saving={state.saving}
      error={state.error}
      onConfirm={(priority) => close(priority)}
      onCancel={() => close(null)}
    />
  );

  return { askNotifyPriority, modal, notifyOpen: state.open };
}
