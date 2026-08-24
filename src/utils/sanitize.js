import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'span', 'mark', 'hr',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'colspan', 'rowspan'];

/**
 * Strip Word/Outlook clipboard junk (StartFragment / EndFragment / conditional comments).
 */
export function stripClipboardArtifacts(value = '') {
  return String(value || '')
    .replace(/<!--\s*StartFragment\s*-->/gi, '')
    .replace(/<!--\s*EndFragment\s*-->/gi, '')
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sanitize HTML before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  const cleaned = stripClipboardArtifacts(dirty);
  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS,
    ALLOW_DATA_ATTR: false,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

export function toPlainText(value) {
  if (value === undefined || value === null) return '';
  return stripClipboardArtifacts(String(value))
    .replace(/<\/?(html|head|body|meta|link|style|xml)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
