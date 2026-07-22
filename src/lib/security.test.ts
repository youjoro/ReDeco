/**
 * Regression tests for security utilities.
 *
 * Guards against regressions in:
 *   1. sanitizeHref  — blocks non-http(s) protocols, passes safe URLs.
 *   2. sanitizeImageSrc — blocks dangerous protocols, allows blob/data/https.
 *   3. validateImageFile — enforces size limits, MIME allowlist, and magic bytes.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHref, sanitizeImageSrc, validateImageFile } from './security';

// ── sanitizeHref ─────────────────────────────────────────────────────────────

describe('sanitizeHref', () => {
  it('passes https URLs', () => {
    expect(sanitizeHref('https://example.com/page')).toBe('https://example.com/page');
  });

  it('passes http URLs', () => {
    expect(sanitizeHref('http://example.com')).toBe('http://example.com');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBe('#');
  });

  it('blocks data: protocol', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeHref('vbscript:msgbox(1)')).toBe('#');
  });

  it('returns # for empty string', () => {
    expect(sanitizeHref('')).toBe('#');
  });

  it('returns # for null/undefined', () => {
    expect(sanitizeHref(null as unknown as string)).toBe('#');
    expect(sanitizeHref(undefined as unknown as string)).toBe('#');
  });

  it('returns # for non-URL garbage', () => {
    expect(sanitizeHref('not a url at all')).toBe('#');
  });
});

// ── sanitizeImageSrc ─────────────────────────────────────────────────────────

describe('sanitizeImageSrc', () => {
  it('passes https image URLs', () => {
    const url = 'https://cdn.pixabay.com/photo/test.jpg';
    expect(sanitizeImageSrc(url)).toBe(url);
  });

  it('passes blob: URLs', () => {
    const url = 'blob:https://example.com/abc-123';
    expect(sanitizeImageSrc(url)).toBe(url);
  });

  it('passes valid data: image URLs', () => {
    const url = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeImageSrc(url)).toBe(url);
  });

  it('blocks data: non-image MIME types', () => {
    expect(sanitizeImageSrc('data:text/html,<script>x</script>')).toBe('');
    expect(sanitizeImageSrc('data:application/javascript,alert(1)')).toBe('');
  });

  it('blocks javascript: in image src', () => {
    expect(sanitizeImageSrc('javascript:alert(1)')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeImageSrc(null as unknown as string)).toBe('');
    expect(sanitizeImageSrc(undefined as unknown as string)).toBe('');
  });
});

// ── validateImageFile ─────────────────────────────────────────────────────────

/** Build a fake File with real magic bytes for the given format. */
function makeImageFile(
  name: string,
  type: string,
  magicBytes: number[],
  sizePad = 0,
): File {
  const payload = new Uint8Array([...magicBytes, ...new Array(sizePad).fill(0x00)]);
  return new File([payload], name, { type });
}

const PNG_MAGIC  = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0];
const GIF_MAGIC  = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a

describe('validateImageFile', () => {
  it('accepts a valid PNG', async () => {
    const file = makeImageFile('photo.png', 'image/png', PNG_MAGIC);
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
  });

  it('accepts a valid JPEG', async () => {
    const file = makeImageFile('photo.jpg', 'image/jpeg', JPEG_MAGIC);
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
  });

  it('accepts a valid GIF', async () => {
    const file = makeImageFile('anim.gif', 'image/gif', GIF_MAGIC);
    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
  });

  it('rejects a file exceeding 10 MB', async () => {
    // Build a file with PNG magic but over the 10 MB limit
    const TEN_MB_PLUS = 10 * 1024 * 1024 + 1;
    const big = new File(
      [new Uint8Array(TEN_MB_PLUS)],
      'huge.png',
      { type: 'image/png' },
    );
    const result = await validateImageFile(big);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/10 MB/);
  });

  it('rejects a disallowed MIME type', async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'doc.pdf', {
      type: 'application/pdf',
    });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not allowed/i);
  });

  it('rejects a file with mismatched magic bytes (PNG ext, SVG content)', async () => {
    const svgBytes = Array.from(
      new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    );
    const file = makeImageFile('evil.png', 'image/png', svgBytes);
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/valid image/i);
  });

  it('rejects a non-File value', async () => {
    const result = await validateImageFile('not-a-file' as unknown as File);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not a file/i);
  });

  it('rejects a file with no type declared', async () => {
    const file = new File([new Uint8Array(PNG_MAGIC)], 'photo', { type: '' });
    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
  });
});
