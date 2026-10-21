import { sanitizeHtml, toPlainText } from '../utils/sanitize';

/**
 * Render stored rich-text / HTML safely. Falls back to plain text paragraphs.
 */
export default function RichHtml({
  html,
  className = 'prose prose-sm max-w-none text-gray-800',
  empty = '—',
}) {
  const raw = html == null ? '' : String(html);
  if (!raw.trim()) {
    return <p className="text-sm text-gray-400">{empty}</p>;
  }
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  if (!looksHtml) {
    return <p className={`whitespace-pre-wrap text-sm text-gray-800 ${className.includes('prose') ? '' : className}`}>{raw}</p>;
  }
  const safe = sanitizeHtml(raw);
  if (!safe.trim() && !toPlainText(raw).trim()) {
    return <p className="text-sm text-gray-400">{empty}</p>;
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe || `<p>${toPlainText(raw)}</p>` }} />;
}
