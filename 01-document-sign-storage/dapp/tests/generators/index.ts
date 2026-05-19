import fc from 'fast-check';

/**
 * Valid bytes32 hex string starting with 0x.
 */
export const documentHash = fc.stringMatching(/^0x[0-9a-f]{64}$/);

/**
 * Valid Ethereum address hex string starting with 0x.
 */
export const ethAddress = fc.stringMatching(/^0x[0-9a-f]{40}$/);

/**
 * UNIX timestamp (roughly current era).
 */
export const unixTimestamp = fc.integer({ min: 1600000000, max: 2000000000 });

/**
 * Non-empty string for file names and categories.
 */
export const fileName = fc.string({ minLength: 1, maxLength: 100 });
export const fileCategory = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Random bytes for digital signatures.
 */
export const digitalSignature = fc.stringMatching(/^0x[0-9a-f]{130}$/);

