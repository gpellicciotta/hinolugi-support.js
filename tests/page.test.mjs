import test from 'node:test';
import assert from 'node:assert/strict';
import { singlePage, pagedResult, bookmarkedPage } from '../js/page.mjs';

test('singlePage creates a non-navigable single page shape', async () => {
  const page = singlePage(['alpha', 'beta', 'gamma']);
  assert.deepEqual(page.items, ['alpha', 'beta', 'gamma']);
  assert.equal(page.pageSize, null);
  assert.equal(page.startBookmark, null);
  assert.equal(page.endBookmark, null);
  assert.equal(page.hasNextPage, false);
  assert.equal(page.hasPrevPage, false);

  assert.equal(await page.nextPage(), null);
  assert.equal(await page.prevPage(), null);
});

test('singlePage safely handles null, undefined, empty array, and scalar inputs', async () => {
  const fromNull = singlePage(null);
  assert.deepEqual(fromNull.items, []);
  assert.equal(fromNull.hasNextPage, false);
  assert.equal(await fromNull.nextPage(), null);

  const fromUndefined = singlePage(undefined);
  assert.deepEqual(fromUndefined.items, []);
  assert.equal(fromUndefined.hasNextPage, false);

  const fromEmpty = singlePage([]);
  assert.deepEqual(fromEmpty.items, []);

  const fromScalar = singlePage('scalar-item');
  assert.deepEqual(fromScalar.items, ['scalar-item']);
});

test('pagedResult handles kebab-case server envelope with first page', async () => {
  const envelope = {
    elements: ['item-1', 'item-2', 'item-3'],
    'page-size': 3,
    'start-bookmark': 'bm-start-1',
    'end-bookmark': 'bm-end-1',
    'current-page': 'first',
  };

  const calls = [];
  const fetchPage = async (dir, bm) => {
    calls.push({ dir, bm });
    return singlePage([`fetched-${dir}-${bm}`]);
  };

  const page = pagedResult(envelope, fetchPage);
  assert.deepEqual(page.items, ['item-1', 'item-2', 'item-3']);
  assert.equal(page.pageSize, 3);
  assert.equal(page.startBookmark, 'bm-start-1');
  assert.equal(page.endBookmark, 'bm-end-1');
  assert.equal(page.hasNextPage, true);
  assert.equal(page.hasPrevPage, false);

  const prevResult = await page.prevPage();
  assert.equal(prevResult, null);
  assert.equal(calls.length, 0);

  const nextResult = await page.nextPage();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { dir: 'next', bm: 'bm-end-1' });
  assert.deepEqual(nextResult.items, ['fetched-next-bm-end-1']);
});

test('pagedResult handles camelCase envelope on a middle page', async () => {
  const envelope = {
    items: ['x', 'y'],
    pageSize: 2,
    startBookmark: 'bm-x',
    endBookmark: 'bm-y',
    currentPage: 'middle',
  };

  const calls = [];
  const fetchPage = async (dir, bm) => {
    calls.push({ dir, bm });
    return singlePage([`page-${dir}-${bm}`]);
  };

  const page = pagedResult(envelope, fetchPage);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.hasPrevPage, true);

  await page.prevPage();
  assert.deepEqual(calls[0], { dir: 'prev', bm: 'bm-x' });

  await page.nextPage();
  assert.deepEqual(calls[1], { dir: 'next', bm: 'bm-y' });
});

test('pagedResult on the last page disables nextPage and enables prevPage', async () => {
  const envelope = {
    items: ['z1', 'z2'],
    pageSize: 2,
    startBookmark: 'bm-z1',
    endBookmark: 'bm-z2',
    currentPage: 'last',
  };

  const calls = [];
  const fetchPage = async (dir, bm) => {
    calls.push({ dir, bm });
    return singlePage(['prev-content']);
  };

  const page = pagedResult(envelope, fetchPage);
  assert.equal(page.hasNextPage, false);
  assert.equal(page.hasPrevPage, true);

  assert.equal(await page.nextPage(), null);
  assert.equal(calls.length, 0);

  const prev = await page.prevPage();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { dir: 'prev', bm: 'bm-z1' });
  assert.deepEqual(prev.items, ['prev-content']);
});

test('pagedResult with empty items disables navigation in both directions', async () => {
  const envelope = {
    items: [],
    pageSize: 5,
    startBookmark: 'bm-start',
    endBookmark: 'bm-end',
    currentPage: 'first',
  };

  const page = pagedResult(envelope, async () => {
    throw new Error('should not be called');
  });

  assert.equal(page.hasNextPage, false);
  assert.equal(page.hasPrevPage, false);
  assert.equal(await page.nextPage(), null);
  assert.equal(await page.prevPage(), null);
});

test('pagedResult respects explicit boolean hasNextPage and hasPrevPage overrides', async () => {
  const envelope = {
    items: ['custom-1'],
    hasNextPage: false,
    hasPrevPage: true,
    startBookmark: 'bm-custom-start',
    endBookmark: 'bm-custom-end',
  };

  let calledDir = null;
  const page = pagedResult(envelope, async (dir) => {
    calledDir = dir;
    return singlePage([]);
  });

  assert.equal(page.hasNextPage, false);
  assert.equal(page.hasPrevPage, true);
  assert.equal(await page.nextPage(), null);

  await page.prevPage();
  assert.equal(calledDir, 'prev');
});

test('pagedResult safely handles null, undefined, and non-object inputs', async () => {
  const nullPage = pagedResult(null);
  assert.deepEqual(nullPage.items, []);
  assert.equal(nullPage.hasNextPage, false);
  assert.equal(nullPage.hasPrevPage, false);
  assert.equal(await nullPage.nextPage(), null);

  const undefinedPage = pagedResult(undefined);
  assert.deepEqual(undefinedPage.items, []);
  assert.equal(undefinedPage.hasNextPage, false);

  const bareArray = pagedResult(['one', 'two']);
  assert.deepEqual(bareArray.items, ['one', 'two']);
  assert.equal(bareArray.hasNextPage, false);
  assert.equal(bareArray.hasPrevPage, false);

  const emptyObj = pagedResult({});
  assert.deepEqual(emptyObj.items, []);
  assert.equal(emptyObj.hasNextPage, false);
  assert.equal(emptyObj.hasPrevPage, false);
});

test('pagedResult supports 3-argument signature (items, paging, fetchPage)', async () => {
  const calls = [];
  const page = pagedResult(
    ['item-a', 'item-b'],
    { pageSize: 2, startBookmark: 'bm-a', endBookmark: 'bm-b', currentPage: 'first' },
    async (dir, bm) => {
      calls.push({ dir, bm });
      return singlePage([`res-${dir}`]);
    }
  );

  assert.deepEqual(page.items, ['item-a', 'item-b']);
  assert.equal(page.pageSize, 2);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.hasPrevPage, false);

  await page.nextPage();
  assert.deepEqual(calls[0], { dir: 'next', bm: 'bm-b' });
});

test('bookmarkedPage creates compatible Page matching hinolugi-counters client contract', async () => {
  const single = singlePage(['a', 'b', 'c']);
  assert.deepEqual(single.items, ['a', 'b', 'c']);
  assert.equal(single.hasNextPage, false);
  assert.equal(await single.nextPage(), null);

  const paged = bookmarkedPage(
    ['item1', 'item2'],
    { pageSize: 2, startBookmark: 'bm1', endBookmark: 'bm2', currentPage: 'first' },
    async (dir, bm) => singlePage([`next-${dir}-${bm}`])
  );
  assert.equal(paged.hasNextPage, true);
  assert.equal(paged.hasPrevPage, false);

  const next = await paged.nextPage();
  assert.deepEqual(next.items, ['next-next-bm2']);
});

test('sequential multi-page navigation across forward and backward steps', async () => {
  const pagesData = [
    { items: ['record-1', 'record-2'], start: 'bm-1', end: 'bm-2' },
    { items: ['record-3', 'record-4'], start: 'bm-3', end: 'bm-4' },
    { items: ['record-5'], start: 'bm-5', end: 'bm-5' },
  ];

  function makePage(index) {
    const data = pagesData[index];
    const isFirst = index === 0;
    const isLast = index === pagesData.length - 1;
    return pagedResult(
      {
        items: data.items,
        pageSize: 2,
        startBookmark: data.start,
        endBookmark: data.end,
        currentPage: isFirst ? 'first' : isLast ? 'last' : 'middle',
      },
      async (dir) => {
        if (dir === 'next' && !isLast) {
          return makePage(index + 1);
        }
        if (dir === 'prev' && !isFirst) {
          return makePage(index - 1);
        }
        return null;
      }
    );
  }

  const p1 = makePage(0);
  assert.deepEqual(p1.items, ['record-1', 'record-2']);
  assert.equal(p1.hasNextPage, true);
  assert.equal(p1.hasPrevPage, false);

  const p2 = await p1.nextPage();
  assert.deepEqual(p2.items, ['record-3', 'record-4']);
  assert.equal(p2.hasNextPage, true);
  assert.equal(p2.hasPrevPage, true);

  const p3 = await p2.nextPage();
  assert.deepEqual(p3.items, ['record-5']);
  assert.equal(p3.hasNextPage, false);
  assert.equal(p3.hasPrevPage, true);
  assert.equal(await p3.nextPage(), null);

  const backToP2 = await p3.prevPage();
  assert.deepEqual(backToP2.items, ['record-3', 'record-4']);

  const backToP1 = await backToP2.prevPage();
  assert.deepEqual(backToP1.items, ['record-1', 'record-2']);
  assert.equal(await backToP1.prevPage(), null);
});
