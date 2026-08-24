import { marked } from 'marked';
import { sanitizeHtml } from './sanitize.js';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(content) {
  if (!content || typeof content !== 'string') return '';
  const html = marked.parse(content, { async: false });
  return sanitizeHtml(html);
}
