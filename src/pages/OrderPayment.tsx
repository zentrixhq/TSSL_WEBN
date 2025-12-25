import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CreditCard, Building2, CheckCircle, AlertCircle, Lock } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_contact: string;
  customer_country: string;
  total_amount: number;
  status: string;
  payment_method: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
}

function PaymentForm({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
      } else if (paymentIntent?.status === 'succeeded') {
        await supabase
          .from('orders')
          .update({
            status: 'processing',
            payment_method: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCardPayment} className="space-y-6">
      <div>
        <PaymentElement />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Processing Payment...' : `Pay Rs. ${order.total_amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function OrderPayment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchOrder();
    }
  }, [token]);

  useEffect(() => {
    if (order && paymentMethod === 'card' && !clientSecret) {
      createPaymentIntent(order.total_amount);
    }
  }, [paymentMethod, order]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_token', token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setOrder(null);
      } else if (data.status === 'completed' || data.payment_method !== 'pending') {
        setPaymentSuccess(true);
        setOrder(data);
      } else {
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (amount: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
    }
  };

  const handleBankTransfer = async () => {
    if (!order) return;

    try {
      await supabase
        .from('orders')
        .update({
          status: 'pending',
          payment_method: 'bank_transfer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      setPaymentSuccess(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-900 text-lg">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The payment link you're looking for doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Completed!</h1>
            <p className="text-gray-600 mb-6">
              {order.payment_method === 'bank_transfer'
                ? 'Your bank transfer confirmation has been received. We will verify and process your order soon.'
                : 'Your payment has been processed successfully. We will start processing your order.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-mono font-semibold text-gray-900">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">Rs. {order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Card Payment</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">Bank Transfer</span>
                </button>
              </div>

              {paymentMethod === 'card' ? (
                clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm order={order} onSuccess={() => setPaymentSuccess(true)} />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading payment form...</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>Please transfer the amount to the following account:</p>
                      <div className="bg-white rounded p-3 space-y-1">
                        <p><span className="font-medium">Bank:</span> DFCC Bank</p>
                        <p><span className="font-medium">Branch:</span> Kiribathgoda Branch</p>
                        <p><span className="font-medium">Account Name:</span> TechShip Sri Lanka
</p>
                        <p><span className="font-medium">Account Number:</span> 101001146891</p>
                        <p><span className="font-medium">Amount:</span> Rs. {order.total_amount.toFixed(2)}</p>
                        <p><span className="font-medium">Reference:</span> {order.order_number}</p>
                      </div>
                      <p className="text-xs mt-2">After transferring, click the button below to confirm. We'll verify your payment and process your order.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBankTransfer}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    I Have Completed the Transfer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-mono text-sm text-gray-900">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="text-gray-900">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900 text-sm">{order.customer_email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-gray-900 font-medium">
                        Rs. {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    Rs. {order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
