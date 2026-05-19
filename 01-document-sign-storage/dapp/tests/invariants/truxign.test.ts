/**
 * Invariant-based Test Suite for Truxign
 * Following the domain-invariants skill workflow.
 */

import fc from 'fast-check';
import { expect, describe, it } from 'vitest';
import { 
  documentHash, 
  ethAddress, 
  unixTimestamp, 
  fileName, 
  fileCategory, 
  digitalSignature 
} from '../generators';
import { getContractInstance } from '../helpers/contract';

describe('Truxign Domain Invariants', () => {

  /**
   * INV-001: Hash Uniqueness
   * A document hash can only be registered once.
   */
  it('INV-001: registering the same hash twice always reverts', { timeout: 30000 }, async () => {
    const contract = await getContractInstance();

    await fc.assert(
      fc.asyncProperty(
        // Generate a random unique hash per run
        documentHash, 
        ethAddress, 
        unixTimestamp, 
        digitalSignature,
        fileName,
        fileCategory,
        async (hash, signer, time, sig, name, category) => {
          // Pre-registration: check if it already exists from a previous run
          const exists = await contract.isDocumentStored(hash);
          if (exists) return true; // Skip if it somehow already exists

          // Register first time
          const tx1 = await contract.storeDocumentHash(hash, time, sig, signer, name, category);
          await tx1.wait();

          // Second registration must always fail
          let failed = false;
          try {
            const tx2 = await contract.storeDocumentHash(hash, time, sig, signer, name, category);
            await tx2.wait();
          } catch (e) {
            failed = true;
          }

          if (!failed) {
            throw new Error(`INV-001: Registering hash ${hash} twice should have failed but succeeded.`);
          }

          return true;
        }
      ),
      { numRuns: 10 } // Limited runs for blockchain interaction
    );
  }, { timeout: 30000 });

  /**
   * INV-003: Signer Integrity
   * A document must always have a valid, non-zero signer address.
   */
  it('INV-003: storing with address(0) must fail', { timeout: 30000 }, async () => {
    const contract = await getContractInstance();
    const zeroAddr = '0x0000000000000000000000000000000000000000';

    await fc.assert(
      fc.asyncProperty(
        documentHash, 
        unixTimestamp, 
        digitalSignature,
        fileName,
        fileCategory,
        async (hash, time, sig, name, category) => {
          await expect(
            contract.storeDocumentHash(hash, time, sig, zeroAddr, name, category)
          ).rejects.toThrow(/Direccion de firmante invalida/i);
          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, { timeout: 30000 });

  /**
   * INV-004: Existence Pre-condition for Verification
   * A document must be registered before it can be verified.
   */
  it('INV-004: verifying a non-registered hash must revert', { timeout: 30000 }, async () => {
    const contract = await getContractInstance();

    await fc.assert(
      fc.asyncProperty(
        documentHash, 
        ethAddress, 
        digitalSignature,
        async (hash, signer, sig) => {
          // Ensure it's not stored
          const exists = await contract.isDocumentStored(hash);
          if (exists) return true;

          await expect(
            contract.verifyDocument(hash, signer, sig)
          ).rejects.toThrow(/Documento no registrado/i);
          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, { timeout: 30000 });

  /**
   * INV-005: Deterministic History
   * The document history must exactly match the set of registered documents.
   */
  it('INV-005: document count and enumeration must be consistent', { timeout: 60000 }, async () => {
    const contract = await getContractInstance();
    
    // We'll test with a set of multiple documents in one run to check consistency
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(documentHash, { minLength: 2, maxLength: 5 }),
        ethAddress,
        unixTimestamp,
        digitalSignature,
        fileName,
        fileCategory,
        async (hashes, signer, time, sig, name, category) => {
          const initialCount = Number(await contract.getDocumentCount());
          
          let successfulAdds = 0;
          for (const hash of hashes) {
            const exists = await contract.isDocumentStored(hash);
            if (!exists) {
              const tx = await contract.storeDocumentHash(hash, time, sig, signer, name, category);
              await tx.wait();
              successfulAdds++;
            }
          }
          
          const finalCount = Number(await contract.getDocumentCount());
          expect(finalCount).toBe(initialCount + successfulAdds);
          
          // Verify that the last added hash can be retrieved by index
          if (finalCount > 0) {
            const lastHash = await contract.getDocumentHashByIndex(finalCount - 1);
            expect(hashes).toContain(lastHash);
          }
          
          return true;
        }
      ),
      { numRuns: 5 } // Complex test, fewer runs to avoid too many txs
    );
  }, 60000);

});

