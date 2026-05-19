import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAddress } from 'ethers';

export async function POST(req: NextRequest) {
  console.log('>>> [web-landing:create-intent] Request START');
  try {
    const rawBody = await req.text();
    console.log('>>> [web-landing:create-intent] Raw Body:', rawBody);
    
    if (!rawBody) {
      return NextResponse.json({ error: 'Body vacío' }, { status: 400 });
    }

    const { amountCents, walletAddress, setupFutureUsage } = JSON.parse(rawBody);

    // 1. Validaciones
    if (!amountCents || typeof amountCents !== 'number') {
      console.error('>>> [web-landing:create-intent] Monto inválido:', amountCents);
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    if (!walletAddress || !isAddress(walletAddress)) {
      console.error('>>> [web-landing:create-intent] Wallet inválida:', walletAddress);
      return NextResponse.json({ error: 'Dirección de wallet inválida' }, { status: 400 });
    }

    // Calcular tokens con 18 decimales para el webhook
    // amountCents * 10^16 = total wei
    const multiplier = BigInt(10) ** BigInt(16);
    const tokensToMint = BigInt(amountCents) * multiplier;

    console.log(`>>> [web-landing:create-intent] Creando PI para ${amountCents} cents y wallet ${walletAddress}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: 'eur',
      setup_future_usage: setupFutureUsage ? 'off_session' : undefined,
      automatic_payment_methods: { enabled: true },
      metadata: { 
        walletAddress, 
        amountEURCents: String(amountCents),
        tokensToMint: tokensToMint.toString()
      },
    });

    console.log('>>> [web-landing:create-intent] Éxito:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error('>>> [web-landing:create-intent] ERROR CRÍTICO:', {
      message: err.message,
      type: err.type,
      code: err.code
    });

    return NextResponse.json({ 
      error: 'Error en el servidor de pagos',
      details: err.message,
      code: err.code || 'UNKNOWN'
    }, { status: 500 });
  }
}
