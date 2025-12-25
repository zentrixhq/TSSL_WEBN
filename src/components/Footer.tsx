import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FooterContent {
  id: string;
  heading: string;
  description: string;
  is_active: boolean;
}

export default function Footer() {
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    try {
      const { data, error } = await supabase
        .from('footer_content')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setFooterContent(data);
    } catch (error) {
      console.error('Error fetching footer content:', error);
    }
  };

  if (!footerContent) return null;

  return (
    <footer className="bg-black text-white py-6 sm:py-8 mt-8 sm:mt-12">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            {footerContent.heading}
          </h3>

          <div
            className="text-xs sm:text-sm text-gray-300 max-w-4xl mx-auto leading-relaxed prose prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: footerContent.description }}
          />
        </div>
      </div>
    </footer>
  );
}
