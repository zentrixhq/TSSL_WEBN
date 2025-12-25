import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, Phone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_contact: string;
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

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },
        { freq: 659.25, time: 0.15, duration: 0.15 },
        { freq: 783.99, time: 0.3, duration: 0.4 }
      ];

      notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + note.time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);

        oscillator.start(audioContext.currentTime + note.time);
        oscillator.stop(audioContext.currentTime + note.time + note.duration);
      });
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data);
        playSuccessSound();
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-900">Loading order details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 p-8 text-center border-b border-green-100">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 text-lg">Thank you for your order</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Order Number</label>
                    <p className="text-lg font-mono font-semibold text-gray-900">{order.order_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Order Date</label>
                    <p className="text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                    <p className="text-gray-900">
                      {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment (Stripe)'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Order Status</label>
                    <span className={`inline-block px-3 py-1 text-sm rounded ${
                      order.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {order.payment_method === 'bank_transfer' && (
              <div className="mb-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Transfer Instructions</h3>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p><strong>Bank Name:</strong> DFCC Bank</p>
                  <p><strong>Account Name:</strong> TechShip Sri Lanka</p>
                  <p><strong>Account Number:</strong> 101001146891</p>
                  <p><strong>Branch:</strong> Kiribathgoda Branch</p>
                  <p><strong>Amount to Transfer:</strong> Rs. {order.total_amount.toFixed(2)} LKR</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> Please transfer the exact amount and send the payment receipt to our email
                    along with your order number <strong>{order.order_number}</strong>. Your order will be processed once we receive the payment confirmation.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="text-gray-900 font-medium">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="text-gray-900 font-medium">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="text-gray-900 font-medium">{order.customer_contact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-gray-900 font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-bold text-gray-900">Rs. {order.total_amount.toFixed(2)} LKR</span>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                <p className="text-green-800 text-sm">
                  A confirmation email has been sent to <strong>{order.customer_email}</strong> with your order details.
                  We will contact you shortly to confirm your order and provide further instructions.
                </p>
              </div>

              <div className="flex gap-4">
                <Link
                  to="/"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
