import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, RotateCcw, Loader2 } from 'lucide-react';
import api from '../services/api';
import apiClient from '../services/api/config.js';
import { isPublicPath } from '../utils/appPaths';
import { renderMarkdown } from '../utils/markdown.js';

function storageKeyFor(audience) {
  return `igiti-chat-agent-id-${audience}`;
}

function readStoredAgent(audience) {
  try {
    return sessionStorage.getItem(storageKeyFor(audience)) || null;
  } catch {
    return null;
  }
}

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
      const res = await apiClient.post(
        '/assistant/chat',
        { message: trimmed, agentId, audience },
        { timeout: 200000 }
      );
      const payload = res.data?.data || res.data;
      const reply = payload?.reply || 'No response received.';
      if (payload?.agentId) persistAgentId(payload.agentId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not reach IGITI.';
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

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="print:hidden fixed bottom-5 right-5 z-[1100] flex h-12 items-center justify-center rounded-full bg-[#2f5d31] px-5 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-[#1e3a1e] focus:outline-none focus:ring-2 focus:ring-[#2f5d31] focus:ring-offset-2"
          aria-label="Open IGITI"
        >
          IGITI
        </button>
      )}

      {open && (
        <div className="print:hidden fixed bottom-5 right-5 z-[1100] flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#2f5d31] px-4 py-3 text-white">
            <p className="text-base font-bold tracking-wide">IGITI SUPPORT</p>
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
            {messages.length === 0 && (
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

            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                IGITI is thinking...
              </div>
            )}
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
