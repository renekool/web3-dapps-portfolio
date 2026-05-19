// Tarea 2.1 — estado PROCESSING añadido
// Tarea 2.2 — campo error_reason opcional añadido
export type MintStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'MINT_SUCCESS'
  | 'PAGADO_PENDIENTE_MINT';

export interface MintRecord {
  status: MintStatus;
  txHash?: string;
  error_reason?: string;
  timestamp: number;
}

const mintStore = new Map<string, MintRecord>();

export function getRecord(piId: string): MintRecord | undefined {
  return mintStore.get(piId);
}

export function setRecord(piId: string, record: MintRecord): void {
  mintStore.set(piId, record);
}

export function hasRecord(piId: string): boolean {
  return mintStore.has(piId);
}
