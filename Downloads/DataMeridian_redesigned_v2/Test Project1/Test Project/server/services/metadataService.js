function metadataCompleteness(dataset) {
  const fields = [
    dataset.name,
    dataset.description,
    dataset.domain,
    dataset.metadata?.organism,
    dataset.type,
    dataset.metadata?.collectionMethod,
    dataset.createdAt,
    dataset.metadata?.license,
    dataset.metadata?.keywords?.length ? 'ok' : '',
    dataset.metadata?.authors?.length ? 'ok' : '',
    dataset.metadata?.institution,
    dataset.metadata?.contact,
    dataset.organization,
    dataset.tags?.length ? 'ok' : '',
  ];

  const filled = fields.filter(Boolean).length;
  const total = fields.length;
  return {
    percent: Math.round((filled / total) * 100),
    filled,
    total,
  };
}

module.exports = { metadataCompleteness };
