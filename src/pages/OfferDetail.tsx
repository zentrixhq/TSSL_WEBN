import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Minus, Plus, Home, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addToCart } from '../lib/cart';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ProductOffer {
  id: string;
  product_id: string;
  title: string;
  price: number;
  region: string;
  delivery_time: string;
  warranty: string;
  stock_count: number;
  description: string;
  features: string[];
  image_url: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  slug: string;
}

export default function OfferDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ProductOffer | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchOfferDetails();
    }
  }, [slug]);

  const fetchOfferDetails = async () => {
    try {
      const { data: offerData, error: offerError } = await supabase
        .from('product_offers')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (offerError) throw offerError;
      setOffer(offerData);

      if (offerData) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', offerData.product_id)
          .maybeSingle();

        if (productError) throw productError;
        setProduct(productData);
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!offer) return;

    try {
      const result = await addToCart(offer.id, quantity);

      if (result.success) {
        navigate('/cart');
      } else {
        alert('Failed to add to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const incrementQuantity = () => {
    if (offer && quantity < offer.stock_count) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-900 text-lg">Loading...</p>
      </div>
    );
  }

  if (!offer || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Offer not found</p>
          <Link to="/" className="text-red-500 hover:text-red-400">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = (offer.price * quantity).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 lg:mb-6 overflow-x-auto">
          <Link to="/" className="hover:text-gray-900 transition-colors flex-shrink-0">
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <Link to="/" className="hover:text-gray-900 transition-colors whitespace-nowrap">
            Software & Apps
          </Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <Link to={`/product/${product.slug}`} className="hover:text-gray-900 transition-colors whitespace-nowrap">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-gray-900 whitespace-nowrap">{product.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{offer.title}</h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:text-gray-900 transition-colors shadow-sm text-sm sm:text-base">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="order-1 lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Product info</h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Delivery Via</span>
                  <span className="text-blue-400 font-semibold">{offer.delivery_time}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Warranty</span>
                  <span className="text-gray-900">{offer.warranty}</span>
                </div>
              </div>

              {offer.features && offer.features.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-3">Features:</h3>
                  <ul className="space-y-2">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-800">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="order-2 lg:col-span-1 lg:row-start-1 lg:col-start-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <span className="text-sm sm:text-base font-medium text-green-500">In Stock</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 border border-gray-300 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="text-gray-900 text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= offer.stock_count}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <span className="text-gray-600 text-base sm:text-lg">Total Amount</span>
                  <div className="text-right">
                    <span className="text-gray-900 text-2xl sm:text-3xl font-bold">Rs. {totalAmount}</span>
                    <span className="text-gray-600 text-xs sm:text-sm ml-2">LKR</span>
                  </div>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg font-semibold py-3 sm:py-4 rounded-lg transition-colors"
                >
                  Buy now
                </button>

                <p className="text-gray-700 text-[10px] sm:text-xs text-center mt-3 sm:mt-4">
                  By purchasing, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>

          {offer.description && (
            <div className="order-3 lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <div
                  className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: offer.description }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
