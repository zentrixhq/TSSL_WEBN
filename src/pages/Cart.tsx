import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Trash2, Gift, CreditCard, Plus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCartItems, updateCartItemQuantity, removeFromCart } from '../lib/cart';
import { supabase } from '../lib/supabase';

interface CartItem {
  id: string;
  quantity: number;
  product_offers: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    products: {
      id: string;
      name: string;
      category: string;
      image_url: string;
    };
  };
}

interface Bundle {
  id: string;
  name: string;
  bundle_price: number;
  offers: Array<{
    id: string;
    title: string;
    price: number;
    image_url: string;
  }>;
  total_original_price: number;
  discount: number;
}

interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  discount_amount: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    loadCartData();
    loadBundles();
  }, []);

  const loadCartData = async () => {
    try {
      const { data } = await getCartItems();
      if (data) {
        setCartItems(data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBundles = async () => {
    try {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .eq('is_active', true)
        .limit(6);

      if (bundlesError) throw bundlesError;

      const bundlesWithOffers = await Promise.all(
        (bundlesData || []).map(async (bundle) => {
          const { data: bundleOffersData, error: bundleOffersError } = await supabase
            .from('bundle_offers')
            .select('offer_id')
            .eq('bundle_id', bundle.id);

          if (bundleOffersError) throw bundleOffersError;

          const offerIds = bundleOffersData.map(bo => bo.offer_id);

          if (offerIds.length === 0) {
            return null;
          }

          const { data: offersData, error: offersError } = await supabase
            .from('product_offers')
            .select('id, title, price, image_url')
            .in('id', offerIds);

          if (offersError) throw offersError;

          const total_original_price = offersData.reduce((sum, o) => sum + o.price, 0);
          const discount = total_original_price - bundle.bundle_price;

          return {
            id: bundle.id,
            name: bundle.name,
            bundle_price: bundle.bundle_price,
            offers: offersData,
            total_original_price,
            discount
          };
        })
      );

      setBundles(bundlesWithOffers.filter(b => b !== null) as Bundle[]);
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateCartItemQuantity(cartItemId, newQuantity);
      await loadCartData();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      await loadCartData();
    } catch (error) {
      console.error('Error removing item:', error);
    }
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

      if (coupon.applicable_to === 'category') {
        const hasMatchingCategory = cartItems.some(item =>
          coupon.category_ids?.includes(item.product_offers.products.id)
        );
        if (!hasMatchingCategory) {
          setCouponError('This coupon is not applicable to items in your cart');
          return;
        }
      } else if (coupon.applicable_to === 'product') {
        const hasMatchingProduct = cartItems.some(item =>
          coupon.product_ids?.includes(item.product_offers.id)
        );
        if (!hasMatchingProduct) {
          setCouponError('This coupon is not applicable to items in your cart');
          return;
        }
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
    return cartItems.reduce((sum, item) => {
      return sum + item.product_offers.price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (appliedCoupon) {
      return Math.max(0, subtotal - appliedCoupon.discount_amount);
    }
    return subtotal;
  };

  const handleContinueToPayment = () => {
    navigate('/checkout', {
      state: {
        appliedCoupon: appliedCoupon
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-900 text-lg">Loading cart...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started</p>
            <Link
              to="/"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const firstItem = cartItems[0];
  const sellerName = firstItem?.product_offers?.products?.category || 'Seller';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Your cart</h1>
          <div className="flex items-center gap-2 text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Complete the order - adding items to the cart does not mean booking.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-gray-600">
                  YOU ARE BUYING FROM <span className="font-semibold text-gray-900">TTECHSHIP SRI LANKA</span>
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 lg:gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product_offers.image_url || item.product_offers.products.image_url ? (
                          <img
                            src={item.product_offers.image_url || item.product_offers.products.image_url}
                            alt={item.product_offers.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs sm:text-sm">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                          {item.product_offers.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
                          {item.product_offers.products.name} - {item.product_offers.products.category}
                        </p>

                        <div className="flex items-center justify-between sm:hidden mt-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                              className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-red-600"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              Rs. {(item.product_offers.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-gray-500">VAT inc.</p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3 lg:gap-4">
                        <select
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 focus:outline-none focus:border-red-600"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      <div className="hidden sm:block text-right">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          Rs. {(item.product_offers.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">VAT inc. if applicable</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-600">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">This item can't be bought as a gift</span>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">GIVE AS A GIFT</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Buy an item and get a ready-to-download gift PDF.{' '}
                    <button className="text-blue-600 hover:underline">Check how it works</button>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">EASY & SECURE PAYMENTS</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-7 h-4 sm:w-8 sm:h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                        VISA
                      </div>
                      <div className="w-7 h-4 sm:w-8 sm:h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
                      <div className="w-7 h-4 sm:w-8 sm:h-5 bg-blue-400 rounded flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                        P
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-600">and 30+ more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:sticky lg:top-6">
              <div className="space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-lg font-semibold text-gray-900">Rs. {subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount ({appliedCoupon.code})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">-Rs. {appliedCoupon.discount_amount.toFixed(2)}</span>
                      <button
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleContinueToPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 rounded-lg transition-colors mb-4 text-sm sm:text-base"
              >
                Continue to payment
              </button>

              {!appliedCoupon && !showCouponInput && (
                <button
                  onClick={() => setShowCouponInput(true)}
                  className="w-full text-blue-600 hover:underline text-xs sm:text-sm font-medium mb-4"
                >
                  Add a discount code
                </button>
              )}

              {showCouponInput && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                  By clicking "Continue to payment" I acknowledge I have read and agreed to{' '}
                  <button className="text-blue-600 hover:underline">Terms & Conditions</button> and{' '}
                  <button className="text-blue-600 hover:underline">Privacy Policy</button>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {bundles.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Buy Together & Pay Less</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{bundle.name}</h3>

                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                      {bundle.offers.map((offer, index) => (
                        <div key={offer.id}>
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex-shrink-0 overflow-hidden">
                                {offer.image_url ? (
                                  <img
                                    src={offer.image_url}
                                    alt={offer.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-400 text-[10px] sm:text-xs">No image</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{offer.title}</p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Rs. {offer.price.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          {index < bundle.offers.length - 1 && (
                            <div className="flex items-center justify-center py-1 sm:py-2">
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          Rs. {bundle.total_original_price.toFixed(2)}
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-gray-900">
                          Rs. {bundle.bundle_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                          Rs. {bundle.discount.toFixed(2)} Discounted
                        </span>
                      </div>
                      <button className="w-full mt-3 sm:mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base">
                        Add Bundle to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
