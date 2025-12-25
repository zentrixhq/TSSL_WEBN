import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchBarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'offer';
  category?: string;
  price?: number;
  image_url?: string;
  slug?: string;
}

export default function SearchBar({ activeCategory, onCategoryChange }: SearchBarProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await fetchCategories(mounted);
      } finally {
        isFetchingRef.current = false;
      }
    };

    loadCategories();

    return () => {
      mounted = false;
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
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const fetchCategories = async (mounted: boolean) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (mounted) {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const performSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];

    const { data: offers } = await supabase
      .from('product_offers')
      .select('id, title, price, image_url, slug, product_id, products(name, category)')
      .ilike('title', `%${query}%`)
      .eq('is_available', true)
      .limit(8);

    if (offers) {
      results.push(...offers.map(o => ({
        id: o.id,
        name: o.title,
        type: 'offer' as const,
        price: o.price,
        image_url: o.image_url,
        category: o.products?.category,
        slug: o.slug
      })));
    }

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

    setSearchResults(results);
    setShowResults(results.length > 0);
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
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96" ref={searchRef}>
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3 w-full border border-gray-200">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search Offer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="bg-transparent border-none outline-none text-gray-900 flex-1 placeholder-gray-500"
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                  >
                    {result.image_url ? (
                      <img
                        src={result.image_url}
                        alt={result.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{result.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {result.category && (
                          <span className="text-xs text-gray-500">{result.category}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 text-white rounded ${
                          result.type === 'product' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {result.type === 'product' ? 'Product' : 'Offer'}
                        </span>
                      </div>
                    </div>
                    {result.price && (
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-sm">
                          Rs. {Number(result.price).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-0 overflow-x-auto w-full md:w-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  if (category.slug === 'all') {
                    navigate('/');
                  } else {
                    navigate(`/category/${category.slug}`);
                  }
                }}
                className={`px-6 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.name
                    ? 'bg-gray-200 text-gray-900 border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
