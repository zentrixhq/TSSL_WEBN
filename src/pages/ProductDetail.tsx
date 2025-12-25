import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  is_available: boolean;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  slug: string;
}

type SortOption = 'recommended' | 'recent' | 'price_low' | 'price_high';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  useEffect(() => {
    if (slug) {
      fetchProductAndOffers();
    }
  }, [slug]);

  useEffect(() => {
    filterAndSortOffers();
  }, [offers, searchQuery, sortBy]);

  const fetchProductAndOffers = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (productError) throw productError;
      setProduct(productData);

      if (productData) {
        const { data: offersData, error: offersError } = await supabase
          .from('product_offers')
          .select('*')
          .eq('product_id', productData.id)
          .eq('is_available', true);

        if (offersError) throw offersError;
        setOffers(offersData || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOffers = () => {
    let filtered = [...offers];

    if (searchQuery) {
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }

    setFilteredOffers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-900 text-lg">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Product not found</p>
          <Link to="/" className="text-red-600 hover:text-red-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
              <Link
                to="/"
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Back</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{product.name}</h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 w-full md:flex-1 border border-gray-200">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Type to filter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 flex-1 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            About <span className="text-gray-900 font-semibold">{filteredOffers.length}</span> results
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-sm sm:text-base text-gray-600">Sort by:</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setSortBy('recommended')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors border ${
                  sortBy === 'recommended'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors border ${
                  sortBy === 'recent'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('price_low')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors border ${
                  sortBy === 'price_low'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Lowest Price
              </button>
              <button
                onClick={() => setSortBy('price_high')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors border ${
                  sortBy === 'price_high'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Highest Price
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {filteredOffers.map((offer) => (
            <Link key={offer.id} to={`/offer/${offer.slug}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold text-sm mb-1 truncate">
                      {offer.title}
                    </h3>
                    <p className="text-gray-500 text-xs">({offer.region})</p>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded text-green-500 text-sm font-medium">
                      In Stock
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 text-sm">from </span>
                    <span className="text-gray-900 font-bold text-xl">Rs. {offer.price.toFixed(2)}</span>
                    <span className="text-gray-600 text-sm ml-1">LKR</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No offers found matching your criteria</p>
          </div>
        )}
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">
          {product.name} for Sale
        </h2>
        <div
          className="text-gray-600 leading-relaxed mb-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: product.description || `${product.name} is an intelligent tool that helps you find information and complete tasks quickly. Browse our selection of ${product.name} accounts above to find the perfect option for your needs.`
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
