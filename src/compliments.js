function createComplimentPayload(text, { randomValue = Math.random(), createdAt } = {}) {
  const trimmedText = typeof text === 'string' ? text.trim() : '';
  if (!trimmedText) {
    throw new Error('Compliment text is required');
  }

  if (typeof randomValue !== 'number' || randomValue < 0 || randomValue > 1) {
    throw new Error('randomValue must be a number between 0 and 1');
  }

  return {
    text: trimmedText,
    cherishedCount: 0,
    createdAt: createdAt ?? new Date().toISOString(),
    randomKey: randomValue,
  };
}

async function fetchRandomCompliments({
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
}, treeId, { randomValue = Math.random(), count = 3 } = {}) {
  if (!treeId) {
    throw new Error('treeId is required');
  }

  const complimentsCollection = collection('trees', treeId, 'compliments');

  const firstQuery = query(
    complimentsCollection,
    where('randomKey', '>=', randomValue),
    orderBy('randomKey'),
    limit(count)
  );

  const firstSnapshot = await getDocs(firstQuery);
  const firstDocs = firstSnapshot.docs ?? [];

  if (firstDocs.length >= count) {
    return firstDocs.slice(0, count);
  }

  const secondQuery = query(
    complimentsCollection,
    where('randomKey', '<', randomValue),
    orderBy('randomKey'),
    limit(count - firstDocs.length)
  );

  const secondSnapshot = await getDocs(secondQuery);
  const secondDocs = secondSnapshot.docs ?? [];

  return [...firstDocs, ...secondDocs].slice(0, count);
}

function cherishComplimentState(treeId) {
  if (!treeId) {
    throw new Error('treeId is required');
  }

  return {
    treeId,
    showFirefly: true,
    effect: 'tiny-glow',
  };
}

module.exports = {
  createComplimentPayload,
  fetchRandomCompliments,
  cherishComplimentState,
};
