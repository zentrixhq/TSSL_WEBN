import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface HomepageSection {
  id: string;
  category_id: string | null;
  title: string;
  display_order: number;
  max_products: number;
  is_active: boolean;
  show_trending: boolean;
  show_title: boolean;
  categories?: {
    name: string;
  };
}

export default function HomepageSectionManagement() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    max_products: 10,
    is_active: true,
    show_trending: false,
    show_title: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsResult, categoriesResult] = await Promise.all([
        supabase
          .from('homepage_sections')
          .select(`
            *,
            categories (
              name
            )
          `)
          .order('display_order'),
        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .neq('slug', 'all')
          .order('name')
      ]);

      if (sectionsResult.error) throw sectionsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setSections(sectionsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a section title');
      return;
    }

    if (!formData.show_trending && !formData.category_id) {
      alert('Please select a category or enable trending products');
      return;
    }

    try {
      const dataToSave = {
        title: formData.title,
        max_products: formData.max_products,
        is_active: formData.is_active,
        show_trending: formData.show_trending,
        show_title: formData.show_title,
        category_id: formData.show_trending ? null : formData.category_id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('homepage_sections')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const maxOrder = sections.length > 0
          ? Math.max(...sections.map(s => s.display_order))
          : 0;

        const { error } = await supabase
          .from('homepage_sections')
          .insert({
            ...dataToSave,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    }
  };

  const handleEdit = (section: HomepageSection) => {
    setEditingId(section.id);
    setFormData({
      category_id: section.category_id || '',
      title: section.title,
      max_products: section.max_products,
      is_active: section.is_active,
      show_trending: section.show_trending,
      show_title: section.show_title,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('homepage_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleMoveUp = async (section: HomepageSection, index: number) => {
    if (index === 0) return;

    const prevSection = sections[index - 1];

    try {
      await Promise.all([
        supabase
          .from('homepage_sections')
          .update({ display_order: prevSection.display_order })
          .eq('id', section.id),
        supabase
          .from('homepage_sections')
          .update({ display_order: section.display_order })
          .eq('id', prevSection.id)
      ]);

      fetchData();
    } catch (error) {
      console.error('Error moving section:', error);
      alert('Failed to reorder section');
    }
  };

  const handleMoveDown = async (section: HomepageSection, index: number) => {
    if (index === sections.length - 1) return;

    const nextSection = sections[index + 1];

    try {
      await Promise.all([
        supabase
          .from('homepage_sections')
          .update({ display_order: nextSection.display_order })
          .eq('id', section.id),
        supabase
          .from('homepage_sections')
          .update({ display_order: section.display_order })
          .eq('id', nextSection.id)
      ]);

      fetchData();
    } catch (error) {
      console.error('Error moving section:', error);
      alert('Failed to reorder section');
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      title: '',
      max_products: 10,
      is_active: true,
      show_trending: false,
      show_title: true,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 font-bold text-xl">Homepage Sections</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-gray-900 font-semibold mb-4">
            {editingId ? 'Edit Section' : 'New Section'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Section Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Featured Cameras"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Max Products
              </label>
              <input
                type="number"
                value={formData.max_products}
                onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="1"
                max="50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.show_trending}
                  onChange={(e) => setFormData({ ...formData, show_trending: e.target.checked, category_id: e.target.checked ? '' : formData.category_id })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                Show Trending Products
              </label>
              <p className="text-gray-500 text-xs mt-1 ml-6">
                Display products marked as trending instead of products from a specific category
              </p>
            </div>

            {!formData.show_trending && (
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required={!formData.show_trending}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.show_title}
                  onChange={(e) => setFormData({ ...formData, show_title: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                Show Section Title
              </label>
              <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No homepage sections configured yet</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 font-semibold text-lg">{section.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      section.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {section.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {section.show_trending ? (
                      <span>Type: <span className="font-medium text-blue-600">Trending Products</span></span>
                    ) : (
                      <span>Category: <span className="font-medium">{section.categories?.name}</span></span>
                    )}
                    <span>Max Products: <span className="font-medium">{section.max_products}</span></span>
                    <span>Order: <span className="font-medium">#{section.display_order}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMoveUp(section, index)}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(section, index)}
                    disabled={index === sections.length - 1}
                    className={`p-2 rounded-lg transition-colors ${
                      index === sections.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
