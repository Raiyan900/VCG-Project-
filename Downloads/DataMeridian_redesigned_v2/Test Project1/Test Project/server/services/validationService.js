/**
 * Deterministic, rule-based dataset validation.
 * Simulates checks a real ingestion pipeline would run.
 */

function runValidation(dataset, latestVersion) {
  const checks = [];
  const warnings = [];
  const errors = [];

  const hasFiles = latestVersion && latestVersion.files && latestVersion.files.length > 0;
  checks.push({
    name: 'File Integrity',
    passed: Boolean(hasFiles),
    message: hasFiles ? 'All files uploaded successfully' : 'No files found for this version',
  });
  if (!hasFiles) errors.push('Missing dataset files');

  const requiredMetaOk = Boolean(
    dataset.metadata?.license && dataset.metadata?.authors?.length && dataset.description
  );
  checks.push({
    name: 'Required Metadata',
    passed: requiredMetaOk,
    message: requiredMetaOk
      ? 'Required metadata fields are present'
      : 'Missing required metadata (license, authors, or description)',
  });
  if (!requiredMetaOk) errors.push('Required metadata incomplete');

  const formatOk = hasFiles;
  checks.push({
    name: 'File Format',
    passed: formatOk,
    message: formatOk ? 'File formats recognized and supported' : 'Unable to verify file format',
  });

  const schemaOk = Boolean(dataset.type && dataset.domain);
  checks.push({
    name: 'Schema Validation',
    passed: schemaOk,
    message: schemaOk ? 'Dataset schema matches expected structure' : 'Schema information incomplete',
  });
  if (!schemaOk) warnings.push('Dataset type or domain not fully specified');

  const optionalMetaOk = Boolean(
    dataset.metadata?.organism && dataset.metadata?.collectionMethod && dataset.metadata?.keywords?.length
  );
  checks.push({
    name: 'Optional Metadata',
    passed: optionalMetaOk,
    message: optionalMetaOk
      ? 'Optional metadata complete'
      : 'Some optional metadata fields (organism, collection method, keywords) are missing',
  });
  if (!optionalMetaOk) warnings.push('Missing optional metadata');

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  let status = 'Passed';
  if (errors.length > 0) status = 'Failed';
  else if (warnings.length > 0) status = 'Warning';

  return { checks, warnings, errors, score, status };
}

module.exports = { runValidation };
