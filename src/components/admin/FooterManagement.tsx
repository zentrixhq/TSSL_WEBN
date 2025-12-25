import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import RichTextEditor from '../RichTextEditor';

interface FooterContent {
  id: string;
  heading: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function FooterManagement() {
  const [footerContents, setFooterContents] = useState<FooterContent[]>([]);
  const [editingFooter, setEditingFooter] = useState<FooterContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    heading: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchFooterContents();
  }, []);

  const fetchFooterContents = async () => {
    try {
      const { data, error } = await supabase
        .from('footer_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFooterContents(data || []);
    } catch (error) {
      console.error('Error fetching footer contents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFooter) {
        const { error } = await supabase
          .from('footer_content')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFooter.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('footer_content')
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingFooter(null);
      resetForm();
      fetchFooterContents();
    } catch (error) {
      console.error('Error saving footer content:', error);
    }
  };

  const handleEdit = (footer: FooterContent) => {
    setEditingFooter(footer);
    setFormData({
      heading: footer.heading,
      description: footer.description,
      is_active: footer.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer content?')) return;

    try {
      const { error } = await supabase
        .from('footer_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFooterContents();
    } catch (error) {
      console.error('Error deleting footer content:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      heading: '',
      description: '',
      is_active: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingFooter(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Footer Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Footer Content
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Heading
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {footerContents.map((footer) => (
              <tr key={footer.id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {footer.heading}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                  <div
                    className="line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: footer.description }}
                  />
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      footer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {footer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(footer)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(footer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingFooter ? 'Edit Footer Content' : 'Create Footer Content'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heading
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) =>
                    setFormData({ ...formData, heading: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter footer description with formatting..."
                  minHeight="200px"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFooter(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingFooter ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
