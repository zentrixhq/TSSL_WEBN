import { useState, useEffect } from 'react';
import { Save, Bell, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function NoticeBarManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    enabled: false,
    text: 'Special Announcement',
    bgColor: '#DC2626',
    textColor: '#FFFFFF',
    link: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          enabled: data.notice_bar_enabled || false,
          text: data.notice_bar_text || 'Special Announcement',
          bgColor: data.notice_bar_bg_color || '#DC2626',
          textColor: data.notice_bar_text_color || '#FFFFFF',
          link: data.notice_bar_link || '',
          imageUrl: data.notice_bar_image_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load notice bar settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      alert('Please enter notice bar text');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        notice_bar_enabled: formData.enabled,
        notice_bar_text: formData.text,
        notice_bar_bg_color: formData.bgColor,
        notice_bar_text_color: formData.textColor,
        notice_bar_link: formData.link || null,
        notice_bar_image_url: formData.imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { error } = await supabase
          .from('homepage_settings')
          .update(dataToSave)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('homepage_settings')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      alert('Notice bar updated successfully!');
    } catch (error) {
      console.error('Error saving notice bar:', error);
      alert('Failed to save notice bar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading notice bar settings...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-gray-900 font-bold text-xl mb-2">Notice Bar</h2>
        <p className="text-gray-600 text-sm">
          Manage the announcement bar displayed at the top of the homepage
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="mb-6">
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            {formData.enabled ? (
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Enable Notice Bar
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Enable Notice Bar
              </span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Notice Text *
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Special Announcement"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Link URL (optional)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/offer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Background Color *
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="#DC2626"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Text Color *
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="#FFFFFF"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="https://example.com/icon.png"
          />
          <p className="text-gray-500 text-xs mt-2">
            Optional icon or image to display on the left side of the text. Recommended height: 32px.
          </p>
        </div>

        {formData.enabled && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Preview
            </label>
            <div
              className="w-full py-3 px-4 rounded-lg"
              style={{ backgroundColor: formData.bgColor }}
            >
              <div className="flex items-center justify-center gap-3">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Notice"
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span
                  className="text-center font-medium text-sm sm:text-base"
                  style={{ color: formData.textColor }}
                >
                  {formData.text || 'Special Announcement'}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Bell className="w-4 h-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Notice Bar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
