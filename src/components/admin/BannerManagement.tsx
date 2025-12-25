import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BannerManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [mobileBannerUrl, setMobileBannerUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setBannerUrl(data.banner_image_url || '');
        setMobileBannerUrl(data.mobile_banner_image_url || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load banner settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bannerUrl.trim()) {
      alert('Please enter a desktop banner image URL');
      return;
    }

    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from('homepage_settings')
          .update({
            banner_image_url: bannerUrl,
            mobile_banner_image_url: mobileBannerUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('homepage_settings')
          .insert({
            banner_image_url: bannerUrl,
            mobile_banner_image_url: mobileBannerUrl || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      alert('Banners updated successfully!');
    } catch (error) {
      console.error('Error saving banners:', error);
      alert('Failed to save banners');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-gray-900 font-bold text-xl mb-2">Homepage Banner</h2>
        <p className="text-gray-600 text-sm">
          Manage the full-width banner images displayed at the top of the homepage. You can set separate banners for desktop and mobile devices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-8">
        <div className="border-b border-gray-200 pb-8">
          <h3 className="text-gray-900 font-semibold text-lg mb-4">Desktop Banner</h3>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Desktop Banner Image URL *
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/desktop-banner.jpg"
              required
            />
            <p className="text-gray-500 text-xs mt-2">
              Enter the full URL of the desktop banner image. Recommended size: 2940x400px or similar wide format.
            </p>
          </div>

          {bannerUrl && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Desktop Preview
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={bannerUrl}
                  alt="Desktop Banner Preview"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-gray-900 font-semibold text-lg mb-4">Mobile Banner (Optional)</h3>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mobile Banner Image URL
            </label>
            <input
              type="url"
              value={mobileBannerUrl}
              onChange={(e) => setMobileBannerUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/mobile-banner.jpg"
            />
            <p className="text-gray-500 text-xs mt-2">
              Optional: Enter a separate banner URL optimized for mobile devices. If left empty, the desktop banner will be used on all devices. Recommended size: 800x400px.
            </p>
          </div>

          {mobileBannerUrl && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Mobile Preview
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-w-sm mx-auto">
                <img
                  src={mobileBannerUrl}
                  alt="Mobile Banner Preview"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <ImageIcon className="w-4 h-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Banners
            </>
          )}
        </button>
      </form>
    </div>
  );
}
