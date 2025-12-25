import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Bell, User, ShoppingCart, X } from 'lucide-react';
import { getCartCount } from '../lib/cart';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'offer';
  category?: string;
  price?: number;
  image_url?: string;
  slug?: string;
}

export default function Header() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<'girl' | 'boy' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCartCount();

    const handleCartUpdate = () => loadCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, selectedCategory]);

  const loadCartCount = async () => {
    const { count } = await getCartCount();
    setCartCount(count);
  };

  const performSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, price, image_url, slug')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(5);

      if (products) {
        results.push(...products.map(p => ({
          id: p.id,
          name: p.name,
          type: 'product' as const,
          category: p.category,
          price: p.price,
          image_url: p.image_url,
          slug: p.slug
        })));
      }
    }

    if (selectedCategory === 'all' || selectedCategory === 'offers') {
      const { data: offers } = await supabase
        .from('product_offers')
        .select('id, title, price, image_url, slug, product_id')
        .ilike('title', `%${query}%`)
        .eq('is_available', true)
        .limit(5);

      if (offers) {
        results.push(...offers.map(o => ({
          id: o.id,
          name: o.title,
          type: 'offer' as const,
          price: o.price,
          image_url: o.image_url,
          slug: o.slug
        })));
      }
    }

    setSearchResults(results);
    setShowResults(results.length > 0);
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'product') {
      navigate(`/product/${result.slug || result.id}`);
    } else {
      navigate(`/offer/${result.slug || result.id}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  const handleChatStart = (agent: 'girl' | 'boy') => {
    setSelectedAgent(agent);
    if (window.LiveChatWidget) {
      window.LiveChatWidget.call('maximize');
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2 md:gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src="https://i.postimg.cc/rF425171/tssl-logo-white.png"
              alt="TechShip Sri Lanka"
              className="h-5 sm:h-6 md:h-8 w-auto"
            />
          </button>

          <div className="relative flex-1 max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg" ref={searchRef}>
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-800 rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border border-gray-700">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="bg-transparent border-none outline-none text-white flex-1 text-[10px] sm:text-xs md:text-sm placeholder-gray-400 min-w-0"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="hidden md:block bg-gray-700 text-white text-xs sm:text-sm rounded px-2 sm:px-3 py-1 border border-gray-600 outline-none"
              >
                <option value="all">All</option>
                <option value="products">Products</option>
                <option value="offers">Offers</option>
              </select>
              <button
                onClick={handleSearchClick}
                className="bg-red-600 hover:bg-red-700 p-1 sm:p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0"
              >
                <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
              </button>
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-80 sm:max-h-96 overflow-y-auto z-50">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-b-0"
                  >
                    {result.image_url ? (
                      <img
                        src={result.image_url}
                        alt={result.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">{result.name}</p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                        {result.category && (
                          <span className="text-[10px] sm:text-xs text-gray-400 truncate">{result.category}</span>
                        )}
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white rounded flex-shrink-0">
                          {result.type === 'product' ? 'Product' : 'Offer'}
                        </span>
                      </div>
                    </div>
                    {result.price && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 font-bold text-[10px] sm:text-sm">
                          Rs. {Number(result.price).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <div className="hidden xl:flex items-center gap-3">
              <span className="text-gray-400 text-sm font-medium">Live Support</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChatStart('girl')}
                  className="group relative"
                  title="Chat with Female Agent"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center hover:scale-110 transition-transform border-2 border-gray-700 hover:border-pink-400">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                </button>

                <button
                  onClick={() => handleChatStart('boy')}
                  className="group relative"
                  title="Chat with Male Agent"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center hover:scale-110 transition-transform border-2 border-gray-700 hover:border-blue-400">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                </button>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-700 hidden xl:block"></div>

            <button className="hidden md:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800 rounded text-white text-xs sm:text-sm hover:bg-gray-700 transition-colors border border-gray-700">
              <span className="w-4 h-3 sm:w-5 sm:h-3.5 bg-red-600 rounded-sm flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white">LK</span>
              <span>LK</span>
            </button>

            <button className="hidden md:block p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors relative">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
            </button>

            <button className="hidden md:block p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors relative">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full"></span>
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-800 rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] md:text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <button className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors flex-shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
