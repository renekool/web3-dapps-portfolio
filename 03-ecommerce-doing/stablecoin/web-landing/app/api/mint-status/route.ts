import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getRecord, setRecord, hasRecord } from '@/lib/mint-store';
import { isAddress } from 'ethers';
import { executeMintWithRetry } from '../webhook/stripe/route';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const piId = searchParams.get('piId');

  if (!piId) {
    return NextResponse.json({ error: 'piId requerido' }, { status: 400 });
  }

  // Tarea 6.4 — si existe en store (incluido PROCESSING), retornar el estado
  if (hasRecord(piId)) {
    const record = getRecord(piId)!;
    return NextResponse.json({
      status: record.status,
      ...(record.txHash ? { txHash: record.txHash } : {}),
      ...(record.error_reason ? { error_reason: record.error_reason } : {}),
    });
  }

  // Tarea 6.1 — piId no en store → reconciliación activa con Stripe
  try {
    const pi = await stripe.paymentIntents.retrieve(piId);

    if (pi.status === 'succeeded') {
      // Tarea 6.2 — Stripe confirmó: disparar mint de forma async
      const walletAddress = pi.metadata?.walletAddress ?? '';
      const tokensToMint = BigInt(pi.amount) * BigInt(10000);

      // Escribir PROCESSING síncronamente
      setRecord(piId, { status: 'PROCESSING', timestamp: Date.now() });

      // Validar wallet antes de disparar
      if (walletAddress && isAddress(walletAddress) && walletAddress.length === 42) {
        (async () => {
          try {
            const txHash = await executeMintWithRetry(walletAddress, tokensToMint);
            setRecord(piId, { status: 'MINT_SUCCESS', txHash, timestamp: Date.now() });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setRecord(piId, {
              status: 'PAGADO_PENDIENTE_MINT',
              error_reason: msg,
              timestamp: Date.now(),
            });
          }
        })();
      } else {
        setRecord(piId, {
          status: 'PAGADO_PENDIENTE_MINT',
          error_reason: 'INVALID_WALLET_ADDRESS',
          timestamp: Date.now(),
        });
      }

      return NextResponse.json({ status: 'PROCESSING' });
    }

    // Tarea 6.3 — Stripe no confirmó
    return NextResponse.json({ status: 'PENDING' });
  } catch {
    return NextResponse.json({ status: 'PENDING' });
  }
}
