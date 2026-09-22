/**
 * AI-powered dataset analysis service.
 * Classification and metadata generation call a real, configurable AI provider
 * (see services/aiProvider.js). Metadata-quality scoring and duplicate detection
 * are rule-based analyses computed directly from real dataset/file data — no
 * random or fabricated values are produced anywhere in this module.
 */

const { callAIForJSON, isAIConfigured, AIError } = require('./aiProvider');

const VALID_DOMAINS = ['Genomics', 'Proteomics', 'Imaging', 'Clinical', 'Transcriptomics', 'Other'];
const NEEDS_CONFIRMATION = 'Needs confirmation';

function buildDatasetContext({ name, description, tags, domain, type, metadata, files }) {
  const fileLines = (files || []).map((f) => {
    const ext = (f.originalName || '').split('.').pop();
    return `- ${f.originalName} (extension: .${ext}, mimeType: ${f.mimeType || 'unknown'}, size: ${f.size || 0} bytes)`;
  });

  return [
    `Dataset name: ${name || '(none provided)'}`,
    `Description: ${description || '(none provided)'}`,
    `Existing tags: ${(tags || []).join(', ') || '(none)'}`,
    `Existing domain: ${domain || '(unset)'}`,
    `Existing type: ${type || '(unset)'}`,
    `Existing metadata: ${metadata ? JSON.stringify(metadata) : '(none)'}`,
    `Files:\n${fileLines.join('\n') || '(no files uploaded yet)'}`,
  ].join('\n');
}

/**
 * Classifies a dataset using real available evidence (name, description, tags,
 * file names/extensions/MIME types, existing metadata). Requires a configured
 * AI provider — throws AIError otherwise.
 */
async function classifyDataset(dataset) {
  const context = buildDatasetContext(dataset);

  const messages = [
    {
      role: 'system',
      content:
        'You are a research-data classification assistant for a scientific dataset management platform. ' +
        'Analyze the evidence provided (name, description, tags, file names/extensions/MIME types, existing metadata) ' +
        'and classify the dataset. Base your answer strictly on the given evidence — do not invent facts. ' +
        'Respond ONLY with a JSON object with these exact keys: ' +
        '"domain" (one of Genomics, Proteomics, Imaging, Clinical, Transcriptomics, Other), ' +
        '"datasetType" (short string, e.g. "Genomic Sequence"), ' +
        '"researchArea" (short string, e.g. "Molecular Biology"), ' +
        '"dataModality" (short string, e.g. "Sequence Data"), ' +
        '"keywords" (array of 3-8 lowercase strings), ' +
        '"tags" (array of 2-5 short lowercase tags), ' +
        '"confidence" (integer 0-100 reflecting how confident you are given the evidence), ' +
        '"reasoning" (one or two sentences explaining the classification based on the evidence).',
    },
    { role: 'user', content: `Classify this dataset:\n\n${context}` },
  ];

  const result = await callAIForJSON(messages);

  const domain = VALID_DOMAINS.includes(result.domain) ? result.domain : 'Other';
  const confidence = Number.isFinite(result.confidence) ? Math.max(0, Math.min(100, Math.round(result.confidence))) : 0;

  return {
    provider: 'ai',
    domain,
    datasetType: String(result.datasetType || 'Unclassified'),
    researchArea: String(result.researchArea || 'Unspecified'),
    dataModality: String(result.dataModality || 'Unspecified'),
    keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 8).map(String) : [],
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 5).map(String) : [],
    confidence,
    reasoning: String(result.reasoning || ''),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Suggests metadata improvements. Fields the AI cannot determine from real
 * evidence must be returned as "Needs confirmation" — the model is explicitly
 * instructed never to invent organizations, institutions, or other facts.
 */
async function generateMetadata(dataset) {
  const context = buildDatasetContext(dataset);

  const messages = [
    {
      role: 'system',
      content:
        'You are a metadata-quality assistant for a scientific research data platform. Given the evidence about a ' +
        'dataset, suggest improved or missing metadata. You must NEVER invent factual information such as an ' +
        'organization, institution, author, or data source that is not supported by the evidence. If a factual field ' +
        'cannot be reliably determined, set its value to exactly "Needs confirmation". ' +
        'Respond ONLY with a JSON object with this exact shape: ' +
        '{"description": string, "domain": string, "researchArea": string, "datasetType": string, ' +
        '"dataModality": string, "keywords": string[], "tags": string[], "organization": string, ' +
        '"institution": string, "collectionMethod": string, "license": string, "suggestedAccessLevel": string, ' +
        '"reasoning": string}. Every field must be present; use "Needs confirmation" for any field you cannot ' +
        'reliably determine, and use the existing value (not "Needs confirmation") when the evidence already supports it.',
    },
    { role: 'user', content: `Suggest metadata for this dataset:\n\n${context}` },
  ];

  const result = await callAIForJSON(messages);

  const asString = (v) => (typeof v === 'string' && v.trim() ? v.trim() : NEEDS_CONFIRMATION);
  const asArray = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

  return {
    provider: 'ai',
    suggestions: {
      description: asString(result.description),
      domain: VALID_DOMAINS.includes(result.domain) ? result.domain : NEEDS_CONFIRMATION,
      researchArea: asString(result.researchArea),
      datasetType: asString(result.datasetType),
      dataModality: asString(result.dataModality),
      keywords: asArray(result.keywords),
      tags: asArray(result.tags),
      organization: asString(result.organization),
      institution: asString(result.institution),
      collectionMethod: asString(result.collectionMethod),
      license: asString(result.license),
      suggestedAccessLevel: asString(result.suggestedAccessLevel),
    },
    reasoning: String(result.reasoning || ''),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic, rule-based metadata quality analysis computed directly from
 * the dataset's real stored metadata. The score reflects actual completeness
 * and consistency — never randomized.
 */
function detectMetadataQualityIssues(dataset) {
  const meta = dataset.metadata || {};
  const missingFields = [];
  const warnings = [];
  const suggestions = [];
  const criticalIssues = [];

  if (!dataset.description || dataset.description.trim().length < 20) {
    criticalIssues.push('Description is missing or too short (fewer than 20 characters)');
  }
  if (!meta.license) missingFields.push('License');
  if (!meta.authors || meta.authors.length === 0) missingFields.push('Authors');
  if (!meta.organism) missingFields.push('Organism');
  if (!meta.collectionMethod) missingFields.push('Collection Method');
  if (!meta.institution) missingFields.push('Institution');
  if (!meta.contact) missingFields.push('Contact');
  if (!meta.keywords || meta.keywords.length === 0) missingFields.push('Keywords');

  const allTags = [...(dataset.tags || []), ...(meta.keywords || [])].map((t) => t.toLowerCase().trim());
  if (new Set(allTags).size !== allTags.length && allTags.length > 0) {
    warnings.push('Duplicate keywords/tags detected');
  }

  if (dataset.domain === 'Other') warnings.push('Dataset domain has not been classified');
  if (!dataset.type || dataset.type === 'Other') warnings.push('Dataset type is unspecified or generic');
  if (!dataset.citationCount && dataset.status === 'Active') suggestions.push('Add citation information to improve discoverability');
  if (dataset.status === 'Active' && (!meta.keywords || meta.keywords.length < 3)) {
    suggestions.push('Add at least 3 keywords to improve dataset discovery');
  }

  const totalChecks = 9;
  const failedChecks = missingFields.length + criticalIssues.length * 2;
  const score = Math.max(0, Math.round(100 - (failedChecks / totalChecks) * 100));

  return {
    score,
    missingFields,
    warnings,
    suggestions,
    criticalIssues,
    generatedAt: new Date().toISOString(),
  };
}

function computeTextSimilarity(a, b) {
  const setA = new Set((a || '').toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set((b || '').toLowerCase().split(/\W+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Categorizes dataset pairs using real signals: shared file hashes (exact
 * physical duplicates), then text similarity of name/description/tags and
 * size proximity for likely/related matches. Never flags datasets as
 * duplicates from name similarity alone.
 */
function classifyDuplicatePair(a, b) {
  const hashesA = new Set((a.fileHashes || []).filter(Boolean));
  const hashesB = new Set((b.fileHashes || []).filter(Boolean));
  const sharedHashes = [...hashesA].filter((h) => hashesB.has(h));

  const textSimilarity = computeTextSimilarity(
    `${a.name} ${a.description} ${(a.tags || []).join(' ')}`,
    `${b.name} ${b.description} ${(b.tags || []).join(' ')}`
  );
  const sizeA = a.size || 0;
  const sizeB = b.size || 0;
  const sizeProximity = sizeA && sizeB ? 1 - Math.abs(sizeA - sizeB) / Math.max(sizeA, sizeB) : 0;

  if (sharedHashes.length > 0) {
    return { category: 'Exact Duplicate', similarity: 100, matchedByHash: true };
  }

  // Combine text + size signals; size proximity only counted when both datasets have real sizes.
  const combined = sizeA && sizeB ? textSimilarity * 0.75 + sizeProximity * 0.25 : textSimilarity;

  if (combined >= 0.75) return { category: 'Likely Duplicate', similarity: Math.round(combined * 1000) / 10, matchedByHash: false };
  if (combined >= 0.45) return { category: 'Related Dataset', similarity: Math.round(combined * 1000) / 10, matchedByHash: false };
  return null; // Different Dataset — not reported
}

function detectDuplicates(datasets) {
  const results = [];
  for (let i = 0; i < datasets.length; i += 1) {
    for (let j = i + 1; j < datasets.length; j += 1) {
      const a = datasets[i];
      const b = datasets[j];
      const match = classifyDuplicatePair(a, b);
      if (match) {
        results.push({
          datasetA: a._id,
          datasetB: b._id,
          similarity: match.similarity,
          category: match.category,
          matchedByHash: match.matchedByHash,
        });
      }
    }
  }
  return { pairs: results };
}

module.exports = {
  isAIConfigured,
  AIError,
  classifyDataset,
  generateMetadata,
  detectMetadataQualityIssues,
  detectDuplicates,
  classifyDuplicatePair,
  computeTextSimilarity,
};
