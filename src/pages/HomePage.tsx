import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BrandCard from '../components/BrandCard';
import Footer from '../components/Footer';
import { supabase, Product } from '../lib/supabase';

interface HomepageSection {
  id: string;
  category_id: string | null;
  title: string;
  display_order: number;
  max_products: number;
  show_trending: boolean;
  show_title: boolean;
  categories?: {
    slug: string;
  };
}

interface CategorySection {
  section: HomepageSection;
  products: (Product & { offers: number })[];
}

interface NoticeBarSettings {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  link?: string;
  imageUrl?: string;
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [bannerUrl, setBannerUrl] = useState('https://i.postimg.cc/7Z4cHD57/banner3.jpg');
  const [mobileBannerUrl, setMobileBannerUrl] = useState('');
  const [noticeBar, setNoticeBar] = useState<NoticeBarSettings>({
    enabled: false,
    text: '',
    bgColor: '#DC2626',
    textColor: '#FFFFFF',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsResult, sectionsResult, offersResult] = await Promise.all([
        supabase
          .from('homepage_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('homepage_sections')
          .select(`
            *,
            categories (
              slug
            )
          `)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('product_offers')
          .select('product_id')
          .eq('is_available', true)
      ]);

      if (!settingsResult.error && settingsResult.data) {
        if (settingsResult.data.banner_image_url) {
          setBannerUrl(settingsResult.data.banner_image_url);
        }
        if (settingsResult.data.mobile_banner_image_url) {
          setMobileBannerUrl(settingsResult.data.mobile_banner_image_url);
        }

        setNoticeBar({
          enabled: settingsResult.data.notice_bar_enabled || false,
          text: settingsResult.data.notice_bar_text || '',
          bgColor: settingsResult.data.notice_bar_bg_color || '#DC2626',
          textColor: settingsResult.data.notice_bar_text_color || '#FFFFFF',
          link: settingsResult.data.notice_bar_link,
          imageUrl: settingsResult.data.notice_bar_image_url,
        });
      }

      if (sectionsResult.error) throw sectionsResult.error;

      const offerCounts = (offersResult.data || []).reduce((acc, offer) => {
        acc[offer.product_id] = (acc[offer.product_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const productQueries = (sectionsResult.data || []).map(section => {
        if (section.show_trending) {
          return supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('is_trending', true)
            .limit(section.max_products)
            .order('name')
            .then(result => ({ section, data: result.data, error: result.error }));
        } else {
          const categorySlug = section.categories?.slug;
          if (!categorySlug) return Promise.resolve({ section, data: null, error: null });

          return supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('category', categorySlug)
            .limit(section.max_products)
            .order('name')
            .then(result => ({ section, data: result.data, error: result.error }));
        }
      });

      const productResults = await Promise.all(productQueries);

      const sections: CategorySection[] = productResults
        .filter(result => !result.error && result.data)
        .map(result => ({
          section: result.section,
          products: (result.data || []).map(product => ({
            ...product,
            offers: offerCounts[product.id] || 0
          }))
        }));

      setCategorySections(sections);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {noticeBar.enabled && noticeBar.text && (
        <div
          className="w-full py-3 px-4"
          style={{ backgroundColor: noticeBar.bgColor }}
        >
          <div className="max-w-7xl mx-auto">
            {noticeBar.link ? (
              <a
                href={noticeBar.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
              >
                {noticeBar.imageUrl && (
                  <img
                    src={noticeBar.imageUrl}
                    alt="Notice"
                    className="h-8 w-auto object-contain"
                  />
                )}
                <span
                  className="text-center font-medium text-sm sm:text-base"
                  style={{ color: noticeBar.textColor }}
                >
                  {noticeBar.text}
                </span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-3">
                {noticeBar.imageUrl && (
                  <img
                    src={noticeBar.imageUrl}
                    alt="Notice"
                    className="h-8 w-auto object-contain"
                  />
                )}
                <span
                  className="text-center font-medium text-sm sm:text-base"
                  style={{ color: noticeBar.textColor }}
                >
                  {noticeBar.text}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {bannerUrl && (
        <div className="w-full mb-2 sm:mb-3 lg:mb-4">
          {mobileBannerUrl ? (
            <>
              <img
                src={mobileBannerUrl}
                alt="Homepage Banner"
                className="w-full h-auto object-cover md:hidden"
              />
              <img
                src={bannerUrl}
                alt="Homepage Banner"
                className="w-full h-auto object-cover hidden md:block"
              />
            </>
          ) : (
            <img
              src={bannerUrl}
              alt="Homepage Banner"
              className="w-full h-auto object-cover"
            />
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-6">
        {loading ? (
          <div className="text-gray-900 text-center py-8 sm:py-12">Loading products...</div>
        ) : (
          <>
            {categorySections.map((categorySection, index) => (
              <section key={categorySection.section.id} className={index < categorySections.length - 1 ? 'mb-8 sm:mb-12 lg:mb-16' : ''}>
                {categorySection.section.show_title && categorySection.section.title && (
                  <div className="mb-6 sm:mb-8 lg:mb-10">
                    <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm">
                      <h2 className="text-gray-900 text-lg sm:text-xl lg:text-2xl font-bold text-center">{categorySection.section.title}</h2>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {categorySection.products.map((product) => (
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
                {categorySection.products.length === 0 && (
                  <p className="text-gray-600 text-center py-8">No products available in this section</p>
                )}
              </section>
            ))}

            {categorySections.length === 0 && (
              <p className="text-gray-600 text-center py-8">No products available</p>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
