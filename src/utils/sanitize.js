import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'span', 'mark', 'hr',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'colspan', 'rowspan'];

/**
 * Sanitize HTML before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Only allow http(s) and relative URLs for links/images.
 */
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
