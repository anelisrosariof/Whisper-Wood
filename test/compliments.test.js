const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createComplimentPayload,
  fetchRandomCompliments,
  cherishComplimentState,
} = require('../src/compliments');

test('createComplimentPayload stores randomKey and default fields', () => {
  const payload = createComplimentPayload('  You matter.  ', {
    randomValue: 0.42,
    createdAt: '2026-11-07T00:00:00.000Z',
  });

  assert.deepEqual(payload, {
    text: 'You matter.',
    cherishedCount: 0,
    createdAt: '2026-11-07T00:00:00.000Z',
    randomKey: 0.42,
  });
});

test('fetchRandomCompliments uses wrap-around when first query returns fewer docs', async () => {
  const queryCalls = [];
  const fakeApi = {
    collection: (...segments) => ({ segments }),
    where: (field, op, value) => ({ type: 'where', field, op, value }),
    orderBy: (field) => ({ type: 'orderBy', field }),
    limit: (value) => ({ type: 'limit', value }),
    query: (...constraints) => {
      queryCalls.push(constraints);
      return constraints;
    },
    getDocs: async (q) => {
      const whereConstraint = q.find((item) => item && item.type === 'where');
      if (whereConstraint.op === '>=') {
        return { docs: [{ id: 'a' }] };
      }
      return { docs: [{ id: 'b' }, { id: 'c' }] };
    },
  };

  const result = await fetchRandomCompliments(fakeApi, 'tree-1', {
    randomValue: 0.75,
    count: 3,
  });

  assert.deepEqual(result.map((doc) => doc.id), ['a', 'b', 'c']);
  assert.equal(queryCalls.length, 2);
  assert.equal(queryCalls[0][1].op, '>=');
  assert.equal(queryCalls[1][1].op, '<');
});

test('fetchRandomCompliments stops after first query when enough docs are found', async () => {
  const queryCalls = [];
  const fakeApi = {
    collection: (...segments) => ({ segments }),
    where: (field, op, value) => ({ type: 'where', field, op, value }),
    orderBy: (field) => ({ type: 'orderBy', field }),
    limit: (value) => ({ type: 'limit', value }),
    query: (...constraints) => {
      queryCalls.push(constraints);
      return constraints;
    },
    getDocs: async () => ({ docs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }),
  };

  const result = await fetchRandomCompliments(fakeApi, 'tree-1', {
    randomValue: 0.2,
    count: 3,
  });

  assert.deepEqual(result.map((doc) => doc.id), ['a', 'b', 'c']);
  assert.equal(queryCalls.length, 1);
});

test('cherishComplimentState enables tiny firefly effect for the tree', () => {
  const state = cherishComplimentState('tree-9');
  assert.deepEqual(state, {
    treeId: 'tree-9',
    showFirefly: true,
    effect: 'tiny-glow',
  });
});
