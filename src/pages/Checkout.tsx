import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info, Lock } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StripePaymentForm from '../components/StripePaymentForm';
import { supabase } from '../lib/supabase';
import { getCartItems, clearCart } from '../lib/cart';
import { getStripe } from '../lib/stripe';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  discount_amount: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'stripe'>('bank_transfer');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripePromise] = useState(() => getStripe());
  const [paymentError, setPaymentError] = useState<string>('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    location.state?.appliedCoupon || null
  );
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    country: ''
  });

  useEffect(() => {
    loadCart();
    generateOrderNumber();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'stripe' && cartItems.length > 0) {
      createPaymentIntent();
    }
  }, [paymentMethod, cartItems]);

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setOrderNumber(`${timestamp}${random}`);
  };

  const loadCart = async () => {
    const { data } = await getCartItems();

    if (!data || data.length === 0) {
      navigate('/cart');
      return;
    }

    const itemsFormatted = data.map((item: any) => ({
      id: item.product_offers.id,
      name: item.product_offers.title,
      quantity: item.quantity,
      price: item.product_offers.price,
      image_url: item.product_offers.image_url
    }));

    setCartItems(itemsFormatted);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        setCouponError('Invalid coupon code');
        return;
      }

      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now < validFrom) {
        setCouponError('This coupon is not yet active');
        return;
      }

      if (now > validUntil) {
        setCouponError('This coupon has expired');
        return;
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        setCouponError('This coupon has reached its usage limit');
        return;
      }

      const subtotal = calculateSubtotal();

      if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
        setCouponError(`Minimum purchase amount of Rs. ${coupon.min_purchase_amount.toFixed(2)} required`);
        return;
      }

      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
        discount_amount: discountAmount
      });

      setCouponCode('');
      setShowCouponInput(false);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponCode('');
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (appliedCoupon) {
      return Math.max(0, subtotal - appliedCoupon.discount_amount);
    }
    return subtotal;
  };

  const createPaymentIntent = async () => {
    setPaymentError('');
    setClientSecret('');

    try {
      const total = calculateTotal();
      console.log('Creating payment intent for amount:', total);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: total,
            currency: 'lkr',
          }),
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          setPaymentError(`Payment error: ${errorData.error || errorText}`);
        } catch {
          setPaymentError(`Failed to initialize payment: ${response.status} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Payment intent response:', data);

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.error) {
        setPaymentError(data.error);
        console.error('Failed to create payment intent:', data.error);
      } else {
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const subtotal = calculateSubtotal();
      const orderData = {
        order_number: orderNumber,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_contact: formData.contact,
        customer_country: formData.country,
        total_amount: calculateTotal(),
        subtotal: subtotal,
        discount_amount: appliedCoupon ? appliedCoupon.discount_amount : 0,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        status: 'paid',
        payment_method: 'stripe',
        items: cartItems
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ usage_count: supabase.raw('usage_count + 1') })
          .eq('code', appliedCoupon.code);
      }

      clearCart();
      navigate(`/order-confirmation/${orderNumber}`);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Payment successful but failed to save order. Please contact support.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const orderData = {
        order_number: orderNumber,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_contact: formData.contact,
        customer_country: formData.country,
        total_amount: calculateTotal(),
        subtotal: subtotal,
        discount_amount: appliedCoupon ? appliedCoupon.discount_amount : 0,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        status: 'pending',
        payment_method: 'bank_transfer',
        items: cartItems
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ usage_count: supabase.raw('usage_count + 1') })
          .eq('code', appliedCoupon.code);
      }

      clearCart();
      navigate(`/order-confirmation/${orderNumber}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-blue-500 text-white rounded-lg p-6 mb-8 flex items-start gap-4">
          <Info className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Please complete the payment for your order #{orderNumber}.
            </h2>
            <p className="text-blue-100">
              Order will be cancelled automatically if no payment is made within 1 hour 59 minutes.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{orderNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                      <span className="text-sm text-gray-500 ml-1">LKR</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  Rs. {subtotal.toFixed(2)} <span className="text-sm text-gray-500">LKR</span>
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Discount ({appliedCoupon.code})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">-Rs. {appliedCoupon.discount_amount.toFixed(2)}</span>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {!appliedCoupon && !showCouponInput && (
                <button
                  onClick={() => setShowCouponInput(true)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Add a discount code
                </button>
              )}

              {showCouponInput && (
                <div className="p-3 bg-white rounded-lg border border-gray-300">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                      disabled={applyingCoupon}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={applyingCoupon}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600 mb-2">{couponError}</p>
                  )}
                  <button
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponCode('');
                      setCouponError('');
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6 bg-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold text-lg">Total amount</span>
              <span className="text-white font-bold text-2xl">
                Rs. {total.toFixed(2)} <span className="text-sm">LKR</span>
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your contact number"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your country</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Bank Transfer</div>
                  <div className="text-sm text-gray-600">Pay via bank transfer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Card Payment</div>
                  <div className="text-sm text-gray-600">Pay with credit/debit card</div>
                </div>
              </button>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Bank Transfer Details</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Bank Name:</strong> DFCC Bank</p>
                  <p><strong>Account Name:</strong> TechShip Sri Lanka</p>
                  <p><strong>Account Number:</strong> 101001146891</p>
                  <p><strong>Branch:</strong> Kiribathgoda Branch
</p>
                  <p className="text-amber-700 mt-3">
                    Please transfer the total amount and send the payment receipt to our WhatsApp with your order number.
                  </p>
                </div>
              </div>
            )}
          </div>

          {paymentMethod === 'bank_transfer' && (
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          )}
        </form>

        {paymentMethod === 'stripe' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h3>
            {!formData.fullName || !formData.email || !formData.contact || !formData.country ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                Please fill in all customer information fields above to proceed with payment.
              </div>
            ) : paymentError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold mb-2">Payment Setup Failed</p>
                <p className="text-red-700 text-sm mb-4">{paymentError}</p>
                <button
                  onClick={createPaymentIntent}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  loading={loading}
                  setLoading={setLoading}
                />
              </Elements>
            ) : (
              <div className="text-center py-8 text-gray-600">
                Loading payment form...
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Lock className="w-5 h-5" />
          <span>Your Payment is Fully Protected with 256-bit SSL Encryption.</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
