'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PurchaseFormProps {
  walletAddress: string | null;
  initialAmount?: string | null;
  redirectUrl?: string | null;
  referenceId?: string | null;
}

function CheckoutForm({ walletAddress, initialAmount, redirectUrl, referenceId }: PurchaseFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(initialAmount || '50');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
  }, [initialAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !walletAddress) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Crear PaymentIntent en backend
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: Math.round(parseFloat(amount) * 100),
          walletAddress,
          metadata: {
            referenceId: referenceId || 'standalone'
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar pago');

      // 2. Confirmar pago con Stripe
      const { clientSecret } = data;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Redirigir a success persistiendo el contexto de integración
        let successUrl = `/success?piId=${paymentIntent.id}&wallet=${walletAddress}`;
        if (redirectUrl) successUrl += `&redirect_url=${encodeURIComponent(redirectUrl)}`;
        if (referenceId) successUrl += `&reference_id=${encodeURIComponent(referenceId)}`;
        
        window.location.href = successUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 ml-1">Monto a comprar (EUR)</label>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-indigo-400 transition-colors">€</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
            min="10"
            max="10000"
            className="w-full bg-gray-800/80 border border-gray-700 focus:border-indigo-500 rounded-2xl py-4 pl-10 pr-6 text-xl font-bold text-white outline-none transition-all"
            placeholder="0.00"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-700/50 rounded-lg text-xs font-bold text-gray-400">Min 10€</div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 ml-1">Tarjeta de Crédito / Débito</label>
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-4 focus-within:border-indigo-500 transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': { color: '#6b7280' },
                  iconColor: '#6366f1',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-indigo-200/70 leading-relaxed">
          Los tokens serán acreditados automáticamente en tu wallet tras la confirmación del pago.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !walletAddress || parseFloat(amount) < 10}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5" />
        )}
        {isProcessing ? 'Procesando Pago...' : `Comprar ${amount || '0'} EURT`}
        {!isProcessing && <ArrowRight className="w-5 h-5 ml-1 opacity-50" />}
      </button>

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
          {errorMessage}
        </div>
      )}
    </form>
  );
}

export default function PurchaseForm(props: PurchaseFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
