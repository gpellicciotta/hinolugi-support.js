/**
 * Uniform paged-result shape for client list endpoints.
 *
 * Hides the distinction between endpoints returning a bare JSON array (single page)
 * and those supporting server-side bookmark pagination behind one consistent shape.
 *
 * @template T
 * @typedef {Object} Page
 * @property {T[]} items Paged collection elements.
 * @property {number|null} pageSize Page capacity limit or null if unpaged.
 * @property {string|null} startBookmark Opaque bookmark pointing to the start of this page.
 * @property {string|null} endBookmark Opaque bookmark pointing to the end of this page.
 * @property {boolean} hasNextPage True if subsequent pages are available.
 * @property {boolean} hasPrevPage True if preceding pages are available.
 * @property {() => Promise<Page<T>|null>} nextPage Function fetching the next page or null.
 * @property {() => Promise<Page<T>|null>} prevPage Function fetching the previous page or null.
 */

/**
 * Builds a single-page Page<T> for endpoints that do not use server-side pagination.
 * Both nextPage() and prevPage() resolve to null.
 *
 * @template T
 * @param {T[]} [items] Initial list of items in the single page.
 * @returns {Page<T>} Fixed single page representation.
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
 * @param {Object|T[]} envelope Server response envelope or item array.
 * @param {(direction: 'next'|'prev'|string, bookmark: string|null) => Promise<Page<T>|null>} [fetchPageOrPaging] Page fetch function or paging descriptor.
 * @param {(direction: 'next'|'prev'|string, bookmark: string|null) => Promise<Page<T>|null>} [maybeFetchPage] Page fetch function when descriptor was passed.
 * @returns {Page<T>} Standardized Page representation.
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
    typeof fetchPage === 'function',
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
 * @param {T[]} items Array of page items.
 * @param {{pageSize?: number, startBookmark?: string|null, endBookmark?: string|null, currentPage?: string}} paging Paging envelope metadata.
 * @param {(pageDirection: string, bookmark: string|null) => Promise<Page<T>|null>} fetchPage Callback to retrieve adjacent pages.
 * @returns {Page<T>} Standardized Page representation.
 */
export function bookmarkedPage(items, paging, fetchPage) {
  return pagedResult({ items, ...(paging || {}) }, fetchPage);
}
