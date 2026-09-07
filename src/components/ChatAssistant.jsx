import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, RotateCcw, Loader2, BookOpen, Sparkles } from 'lucide-react';
import api from '../services/api';
import { isPublicPath } from '../utils/appPaths';
import { renderMarkdown } from '../utils/markdown.js';

const ASSISTANT_TIMEOUT_MS = 300000;

function friendlyAssistantError(err) {
  const serverMsg = err?.response?.data?.message;
  if (serverMsg && !/timeout of \d+ms exceeded/i.test(serverMsg)) return serverMsg;

  const raw = String(err?.message || '');
  const isTimeout =
    err?.code === 'ECONNABORTED' ||
    /timeout/i.test(raw) ||
    /timeout of \d+ms exceeded/i.test(String(serverMsg || ''));

  if (isTimeout) {
    return 'IGITI is taking longer than usual. Please wait a moment and try again.';
  }
  return serverMsg || raw || 'Could not reach IGITI. Please try again.';
}

/** Bump when documentation pack changes so old agents reload fresh docs. */
function storageKeyFor(audience) {
  return `igiti-chat-agent-id-v4-docs-${audience}`;
}

function readStoredAgent(audience) {
  try {
    return sessionStorage.getItem(storageKeyFor(audience)) || null;
  } catch {
    return null;
  }
}

const LOADING_STEPS_PUBLIC = [
  { icon: BookOpen, label: 'Loading RWVCA documentation…' },
  { icon: BookOpen, label: 'Reading live website facts…' },
  { icon: Sparkles, label: 'IGITI AI is preparing your answer…' },
  { icon: Sparkles, label: 'Almost ready…' },
];

const LOADING_STEPS_STAFF = [
  { icon: BookOpen, label: 'Loading MIS system documentation…' },
  { icon: BookOpen, label: 'Matching menus and workflows…' },
  { icon: Sparkles, label: 'IGITI AI is preparing your answer…' },
  { icon: Sparkles, label: 'Almost ready…' },
];

function MessageBody({ message }) {
  if (message.role === 'user' || message.isError) {
    return <span className="whitespace-pre-wrap">{message.content}</span>;
  }

  return (
    <div
      className="igitit-prose prose prose-sm max-w-none text-gray-800 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
    />
  );
}

function LoadingStatus({ audience }) {
  const steps = audience === 'public' ? LOADING_STEPS_PUBLIC : LOADING_STEPS_STAFF;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(timer);
  }, [audience, steps.length]);

  const step = steps[stepIndex] || steps[0];
  const Icon = step.icon;

  return (
    <div className="rounded-2xl border border-[#2f5d31]/15 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start gap-2 text-sm text-[#2f5d31]">
        <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />
        <div className="min-w-0 flex-1">
          <p className="font-medium flex items-center gap-1.5">
            <Icon size={14} className="shrink-0" />
            <span>{step.label}</span>
          </p>
          <div className="mt-2 flex gap-1">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-[#2f5d31]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            First reply can take a bit longer while documentation is loaded for the AI.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChatAssistant() {
  const location = useLocation();
  const audience = isPublicPath(location.pathname) ? 'public' : 'staff';
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState(() => readStoredAgent(audience));
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const audienceRef = useRef(audience);

  useEffect(() => {
    if (audienceRef.current === audience) return;
    audienceRef.current = audience;
    setMessages([]);
    setError('');
    setInput('');
    setAgentId(readStoredAgent(audience));
  }, [audience]);

  useEffect(() => {
    api.get('/assistant/config', { audience })
      .then((res) => {
        setEnabled(Boolean(res?.data?.enabled));
        setSuggestions(Array.isArray(res?.data?.suggestedPrompts) ? res.data.suggestedPrompts : []);
      })
      .catch(() => setEnabled(false));
  }, [audience]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const persistAgentId = useCallback((id) => {
    setAgentId(id);
    try {
      const key = storageKeyFor(audience);
      if (id) sessionStorage.setItem(key, id);
      else sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }, [audience]);

  const sendMessage = async (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed || loading) return;

    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(
        '/assistant/chat',
        { message: trimmed, agentId, audience },
        { timeout: ASSISTANT_TIMEOUT_MS }
      );
      const payload = res?.data || res;
      const reply = payload?.reply || 'No response received.';
      if (payload?.agentId) persistAgentId(payload.agentId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = friendlyAssistantError(err);
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: msg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    setError('');
    try {
      if (agentId) await api.post('/assistant/reset', { agentId });
    } catch {
      // ignore reset failures
    }
    persistAgentId(null);
    setMessages([]);
  };

  if (!enabled) return null;

  const placeholder = audience === 'public' ? 'Ask IGITI anything about RWVCA...' : 'Ask IGITI about MIS workflows...';
  const emptyHint =
    audience === 'public'
      ? 'IGITI loads RWVCA documentation first, then answers with AI.'
      : 'IGITI loads full MIS documentation first, then answers with easy steps.';

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="IGITI — Ask me anything about RWVCA"
          className="print:hidden group fixed bottom-5 right-5 z-[1100] bg-transparent p-0 shadow-none transition hover:scale-105 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#2f5d31] focus:ring-offset-2"
          aria-label="Open IGITI"
        >
          <img
            src="/IGITI.PNG"
            alt="IGITI"
            className="block transition group-hover:drop-shadow-lg"
            style={{ width: '4cm', height: '4cm', objectFit: 'contain' }}
          />
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
            IGITI — Ask me anything
            <span className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
          </span>
        </button>
      )}

      {open && (
        <div className="print:hidden fixed bottom-5 right-5 z-[1100] flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#2f5d31] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/IGITI.PNG"
                alt="IGITI"
                className="h-10 w-auto shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="text-base font-bold tracking-wide">IGITI SUPPORT</p>
                <p className="text-[11px] text-white/80">Docs first · AI answers</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Start new conversation"
                title="New conversation"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close IGITI"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4">
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 px-1">{emptyHint}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-[#2f5d31]/20 bg-white px-3 py-1.5 text-left text-xs text-[#2f5d31] hover:bg-[#2f5d31]/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2f5d31] text-white whitespace-pre-wrap'
                      : msg.isError
                        ? 'border border-red-200 bg-red-50 text-red-700 whitespace-pre-wrap'
                        : 'border border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  <MessageBody message={msg} />
                </div>
              </div>
            ))}

            {loading && <LoadingStatus audience={audience} />}
          </div>

          <form
            className="border-t border-gray-200 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            {error && !loading && (
              <p className="mb-2 text-xs text-red-600">{error}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={placeholder}
                className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#2f5d31] focus:outline-none focus:ring-1 focus:ring-[#2f5d31]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f5d31] text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
