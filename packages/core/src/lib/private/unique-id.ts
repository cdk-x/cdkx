import * as crypto from 'node:crypto';

/**
 * Segment IDs that are completely hidden from the logical ID (not used in
 * either the human-readable part or the hash input).
 */
const HIDDEN_ID = 'Default';

/**
 * Segment IDs that are hidden from the *human-readable* part of the logical ID
 * but are still included in the hash computation.
 * Mirrors AWS CDK's behaviour for the conventional 'Resource' L1 node name.
 */
const HIDDEN_FROM_HUMAN_ID = 'Resource';

const PATH_SEP = '/';
const HASH_LEN = 8;
const MAX_HUMAN_LEN = 240; // total max is 255; 255 - 8 (hash) - some slack
const MAX_ID_LEN = 255;

/**
 * Calculates a unique, stable logical ID for a construct from its path
 * components.
 *
 * Algorithm (adapted from AWS CDK's `makeUniqueId` with SHA-256):
 *
 * 1. Strip any `'Default'` segments entirely (both human part and hash).
 * 2. Single-component paths: return the alphanumeric-only version as-is
 *    (no hash suffix needed — matches AWS CDK's transparent-migration rule).
 * 3. Hash = first 8 hex chars of `sha256(components.join('/'))`, uppercased.
 * 4. Human part = deduplicated segments, with `'Resource'` filtered out,
 *    non-alphanumeric chars stripped, joined, truncated to 240 chars.
 * 5. Return `humanPart + hash`.
 *
 * Examples (with SHA-256):
 *   ['MyStack', 'WebServer', 'Resource'] → 'MyStackWebServer' + 8-char hash
 *   ['MyStack', 'Firewall']              → 'MyStackFirewall'  + 8-char hash
 *   ['MyStack']                          → 'MyStack'  (single component, no hash)
 *
 * @param components The path segments (e.g. `node.path.split('/')`)
 */
export function makeUniqueId(components: string[]): string {
  // 1. Drop 'Default' segments entirely
  components = components.filter((x) => x !== HIDDEN_ID);

  if (components.length === 0) {
    throw new Error('Unable to calculate a unique id for an empty set of components');
  }

  // 2. Single-component fast path (no hash needed)
  if (components.length === 1) {
    const candidate = removeNonAlphanumeric(components[0]);
    if (candidate.length <= MAX_ID_LEN) {
      return candidate;
    }
  }

  // 3. Hash over the full path (including 'Resource' segments)
  const hash = pathHash(components);

  // 4. Human-readable prefix
  const human = removeDupes(components)
    .filter((x) => x !== HIDDEN_FROM_HUMAN_ID)
    .map(removeNonAlphanumeric)
    .join('')
    .slice(0, MAX_HUMAN_LEN);

  // 5. Concatenate
  return human + hash;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first {@link HASH_LEN} hex chars of the SHA-256 digest of the
 * joined path, uppercased.
 */
function pathHash(components: string[]): string {
  const digest = crypto.createHash('sha256').update(components.join(PATH_SEP)).digest('hex');
  return digest.slice(0, HASH_LEN).toUpperCase();
}

/** Strip every non-alphanumeric character. */
function removeNonAlphanumeric(s: string): string {
  return s.replace(/[^A-Za-z0-9]/g, '');
}

/**
 * Remove consecutive duplicate suffixes from path segments.
 *
 * If the previous component already ends with the current one, skip it.
 * e.g. ['FooBar', 'Bar', 'Resource'] → ['FooBar', 'Resource']
 */
function removeDupes(components: string[]): string[] {
  const result: string[] = [];
  for (const component of components) {
    if (result.length === 0 || !result[result.length - 1].endsWith(component)) {
      result.push(component);
    }
  }
  return result;
}
