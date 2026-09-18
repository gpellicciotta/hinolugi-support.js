/**
 * Uniform paged-result shape for client list endpoints.
 *
 * Hides the distinction between endpoints returning a bare JSON array (single page)
 * and those supporting server-side bookmark pagination behind one consistent shape.
 *
 * @template T
 * @typedef {Object} Page
 * @property {T[]} items
 * @property {number|null} pageSize
 * @property {string|null} startBookmark
 * @property {string|null} endBookmark
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 * @property {() => Promise<Page<T>|null>} nextPage
 * @property {() => Promise<Page<T>|null>} prevPage
 */

/**
 * Builds a single-page Page<T> for endpoints that do not use server-side pagination.
 * Both nextPage() and prevPage() resolve to null.
 *
 * @template T
 * @param {T[]} [items]
 * @returns {Page<T>}
 */
export function singlePage(items) {
  const safeItems = Array.isArray(items) ? items : items == null ? [] : [items];
  return {
    items: safeItems,
    pageSize: null,
    startBookmark: null,
    endBookmark: null,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: async () => null,
    prevPage: async () => null,
  };
}

/**
 * Builds a Page<T> from a server response envelope or paging descriptor.
 *
 * Accepts either:
 * - An envelope object `{ items|elements, pageSize|'page-size', startBookmark|'start-bookmark', endBookmark|'end-bookmark', currentPage|'current-page'|page }`
 * - An array of items with optional second argument paging configuration
 *
 * @template T
 * @param {Object|T[]} envelope
 * @param {(direction: 'next'|'prev'|string, bookmark: string|null) => Promise<Page<T>|null>} [fetchPageOrPaging]
 * @param {(direction: 'next'|'prev'|string, bookmark: string|null) => Promise<Page<T>|null>} [maybeFetchPage]
 * @returns {Page<T>}
 */
export function pagedResult(envelope, fetchPageOrPaging, maybeFetchPage) {
  if (envelope === null || envelope === undefined) {
    return singlePage([]);
  }

  let actualEnvelope = envelope;
  let fetchPage = fetchPageOrPaging;

  if (Array.isArray(envelope) && typeof fetchPageOrPaging === 'object' && fetchPageOrPaging !== null) {
    actualEnvelope = { items: envelope, ...fetchPageOrPaging };
    fetchPage = maybeFetchPage;
  } else if (Array.isArray(envelope)) {
    return singlePage(envelope);
  }

  const items = Array.isArray(actualEnvelope.items)
    ? actualEnvelope.items
    : Array.isArray(actualEnvelope.elements)
      ? actualEnvelope.elements
      : [];

  const rawPageSize = actualEnvelope.pageSize ?? actualEnvelope['page-size'];
  const pageSize =
    typeof rawPageSize === 'number'
      ? rawPageSize
      : rawPageSize != null && Number.isFinite(Number(rawPageSize))
        ? Number(rawPageSize)
        : null;

  const startBookmark = actualEnvelope.startBookmark ?? actualEnvelope['start-bookmark'] ?? null;
  const endBookmark = actualEnvelope.endBookmark ?? actualEnvelope['end-bookmark'] ?? null;

  const hasPagingInfo = Boolean(
    actualEnvelope.currentPage ||
      actualEnvelope['current-page'] ||
      actualEnvelope.page ||
      startBookmark !== null ||
      endBookmark !== null ||
      typeof fetchPage === 'function'
  );

  const rawCurrentPage = actualEnvelope.currentPage ?? actualEnvelope['current-page'] ?? actualEnvelope.page;
  const currentPage = rawCurrentPage != null ? String(rawCurrentPage) : hasPagingInfo ? 'first' : null;

  const hasNextPage =
    typeof actualEnvelope.hasNextPage === 'boolean'
      ? actualEnvelope.hasNextPage
      : hasPagingInfo && currentPage !== 'last' && items.length > 0;

  const hasPrevPage =
    typeof actualEnvelope.hasPrevPage === 'boolean'
      ? actualEnvelope.hasPrevPage
      : hasPagingInfo && currentPage !== 'first' && items.length > 0;

  return {
    items,
    pageSize,
    startBookmark,
    endBookmark,
    hasNextPage,
    hasPrevPage,
    nextPage: async () => (hasNextPage && typeof fetchPage === 'function' ? fetchPage('next', endBookmark) : null),
    prevPage: async () => (hasPrevPage && typeof fetchPage === 'function' ? fetchPage('prev', startBookmark) : null),
  };
}

/**
 * Builds a Page<T> matching the hinolugi-counters client signature.
 *
 * @template T
 * @param {T[]} items
 * @param {{pageSize?: number, startBookmark?: string|null, endBookmark?: string|null, currentPage?: string}} paging
 * @param {(pageDirection: string, bookmark: string|null) => Promise<Page<T>|null>} fetchPage
 * @returns {Page<T>}
 */
export function bookmarkedPage(items, paging, fetchPage) {
  return pagedResult({ items, ...(paging || {}) }, fetchPage);
}
