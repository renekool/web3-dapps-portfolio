# Domain Invariants - Truxign

This document formalizes the invariants of the Truxign system.
An invariant is a condition that must hold true in ALL valid states of the system.
These invariants are derived from the governance specifications and must remain
true regardless of which sequence of operations is performed.

## Traceability

Each invariant traces to one or more requirements in:
- `spec.md` (functional requirements)
- `spec-acceptance.md` (acceptance criteria)
- `spec-nfr.md` (non-functional requirements)

---

## INV-001: Hash Uniqueness

**Rule**: A document hash can only be registered once.

**Spec refs**: RF-05, AC-05.1, AC-05.2 (spec-acceptance.md)
**Rationale**: Document integrity requires a globally unique content address. Any duplication would undermine the authenticity guarantee.

**Property**: For any valid hash H, if `storeDocumentHash(H, ...)` has succeeded, all subsequent calls to `storeDocumentHash(H, ...)` must fail.

---

## INV-002: Immutability of Records

**Rule**: Once a document is registered, its associated data (signer, timestamp, signature) cannot be changed.

**Spec refs**: AC-05.1, NFR-02 (spec-nfr.md)
**Rationale**: The blockchain serves as an immutable audit trail. Allowing modifications would void the verification process.

**Property**: For any registered hash H, any call to any function must not modify the `Document` struct associated with H.

---

## INV-003: Signer Integrity

**Rule**: A document must always have a valid, non-zero signer address.

**Spec refs**: RF-21, AC-05.1
**Rationale**: Anonymous registration (address 0) is invalid as it prevents attribution of the signature.

**Property**: For any registered document, `documents[H].signer != address(0)`.

---

## INV-004: Existence Pre-condition for Verification

**Rule**: A document must be registered before it can be verified.

**Spec refs**: RF-09, AC-08.1
**Rationale**: Verification against non-existent records is logically impossible in this system.

**Property**: `verifyDocument(H, ...)` must revert if `isDocumentStored(H)` is false.

---

## INV-005: Deterministic History

**Rule**: The document history (enumeration) must exactly match the set of registered documents.

**Spec refs**: RF-11
**Rationale**: The history must be an honest representation of all on-chain activity.

**Property**: `getDocumentCount()` must equal the number of successful `storeDocumentHash` calls with unique hashes. Every hash in `documentHashes` must exist in the `documents` mapping.

---

## INV-006: Global Integrity of Storage

**Rule**: Storing a new document must not affect previously stored documents.

**Spec refs**: NFR-02
**Rationale**: Write operations must be strictly additive and isolated.

**Property**: `storeDocumentHash(H2)` where `H2 != H1` must not change the state of `documents[H1]`.
