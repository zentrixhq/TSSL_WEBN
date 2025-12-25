import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BrandCard from '../components/BrandCard';
import Footer from '../components/Footer';
import { supabase, Product } from '../lib/supabase';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<(Product & { offers: number })[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!slug || isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await fetchCategoryData(mounted);
      } finally {
        isFetchingRef.current = false;
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const fetchCategoryData = async (mounted: boolean) => {
    if (!slug) return;

    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!mounted) return;

      if (!categoryData) {
        setCategoryName('Category Not Found');
        setProducts([]);
        setLoading(false);
        return;
      }

      setCategoryName(categoryData.name);
      setActiveCategory(categoryData.name);

      const { data: offersData, error: offersError } = await supabase
        .from('product_offers')
        .select('product_id')
        .eq('is_available', true);

      if (offersError) throw offersError;

      const offerCounts = offersData.reduce((acc, offer) => {
        acc[offer.product_id] = (acc[offer.product_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category', slug)
        .order('name');

      if (productsError) throw productsError;

      if (!mounted) return;

      const productsWithCounts = (productsData || []).map(product => ({
        ...product,
        offers: offerCounts[product.id] || 0
      }));

      setProducts(productsWithCounts);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {loading ? (
          <div className="text-gray-900 text-center py-12">Loading products...</div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {categoryName}
              </h1>
              <p className="text-gray-600">
                {products.length} {products.length === 1 ? 'product' : 'products'} available
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No products found in this category</p>
                <p className="text-gray-500">Check back later for new additions</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {products.map((product) => (
                  <BrandCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    offers={product.offers}
                    image={product.image_url}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
