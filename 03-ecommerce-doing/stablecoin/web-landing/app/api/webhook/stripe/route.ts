import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getRecord, setRecord } from '@/lib/mint-store';
import { euroToken } from '@/lib/eurotoken';
import { isAddress } from 'ethers';

// Tarea 5.1 — función de mint con retry
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeMintWithRetry(
  walletAddress: string,
  tokensToMint: bigint
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    // Tarea 5.2 — backoff exponencial
    if (attempt === 2) await sleep(1000);
    if (attempt === 3) await sleep(2000);

    try {
      const tx = await euroToken.mint(walletAddress, tokensToMint);
      const receipt = await tx.wait();
      return receipt.hash as string;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[mint] Intento ${attempt} fallido:`, lastError.message);
    }
  }

  // Tarea 5.3 — persiste solo .message del error
  throw lastError!;
}

export async function POST(req: NextRequest) {
  // Tarea 3.2 y D5 — leer raw body para validación HMAC
  const rawBody = await req.text();
  const stripeSignature = req.headers.get('stripe-signature') ?? '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const pi = event.data.object as {
    id: string;
    amount: number;
    metadata: Record<string, string>;
  };

  const paymentIntentId = pi.id;

  // Tarea 3.1 — verificar idempotencia ANTES de PROCESSING
  const existing = getRecord(paymentIntentId);
  if (existing && ['PROCESSING', 'MINT_SUCCESS', 'PAGADO_PENDIENTE_MINT'].includes(existing.status)) {
    return NextResponse.json({ received: true });
  }

  // Tarea 3.1 — escritura SÍNCRONA (sin await) de PROCESSING → exclusión mutual
  setRecord(paymentIntentId, { status: 'PROCESSING', timestamp: Date.now() });

  // Tarea 4.1–4.3 — validar walletAddress server-side con ethers.isAddress
  const walletAddress = pi.metadata?.walletAddress ?? '';
  if (!walletAddress || !isAddress(walletAddress) || walletAddress.length !== 42) {
    // Tarea 4.2 — registrar PAGADO_PENDIENTE_MINT con error_reason
    setRecord(paymentIntentId, {
      status: 'PAGADO_PENDIENTE_MINT',
      error_reason: 'INVALID_WALLET_ADDRESS',
      timestamp: Date.now(),
    });
    return NextResponse.json({ received: true });
  }

  // Tarea 3.3, 5.1 — dispatch del mint de forma async (webhook responde 200 inmediatamente)
  const tokensToMint = BigInt(pi.amount) * BigInt(10000);

  // Ejecutar mint de forma async — no bloqueamos la respuesta HTTP
  (async () => {
    try {
      const txHash = await executeMintWithRetry(walletAddress, tokensToMint);
      setRecord(paymentIntentId, { status: 'MINT_SUCCESS', txHash, timestamp: Date.now() });
      console.log(`[mint] ✅ ${paymentIntentId} → ${txHash}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Tarea 5.3, 5.4 — error_reason con .message, siempre retornamos 200
      setRecord(paymentIntentId, {
        status: 'PAGADO_PENDIENTE_MINT',
        error_reason: msg,
        timestamp: Date.now(),
      });
      console.error(`[mint] ❌ ${paymentIntentId} → ${msg}`);
    }
  })();

  // Tarea 5.4 — siempre HTTP 200, Stripe no reintenta
  return NextResponse.json({ received: true });
}
