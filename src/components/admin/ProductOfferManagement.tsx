import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase, Product } from '../../lib/supabase';
import RichTextEditor from '../RichTextEditor';

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
  created_at: string;
}

export default function ProductOfferManagement() {
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<ProductOffer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    price: 0,
    region: 'Global',
    delivery_time: 'Instant',
    warranty: 'No warranty',
    stock_count: 0,
    is_available: true,
    features: [] as string[],
    image_url: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersResult, productsResult] = await Promise.all([
        supabase.from('product_offers').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name'),
      ]);

      if (offersResult.error) throw offersResult.error;
      if (productsResult.error) throw productsResult.error;

      setOffers(offersResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const slug = generateSlug(formData.title);

      if (editingOffer) {
        const { error } = await supabase
          .from('product_offers')
          .update({ ...formData, slug, updated_at: new Date().toISOString() })
          .eq('id', editingOffer.id);

        if (error) throw error;
        alert('Offer updated successfully!');
      } else {
        const { error } = await supabase.from('product_offers').insert([{ ...formData, slug }]);

        if (error) throw error;
        alert('Offer added successfully!');
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Error saving offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase.from('product_offers').delete().eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  const handleEdit = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      product_id: offer.product_id,
      title: offer.title,
      price: offer.price,
      region: offer.region,
      delivery_time: offer.delivery_time,
      warranty: offer.warranty,
      stock_count: offer.stock_count,
      is_available: offer.is_available,
      features: offer.features || [],
      image_url: offer.image_url || '',
      description: offer.description || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      title: '',
      price: 0,
      region: 'Global',
      delivery_time: 'Instant',
      warranty: 'No warranty',
      stock_count: 0,
      is_available: true,
      features: [],
      image_url: '',
      description: '',
    });
    setEditingOffer(null);
    setShowForm(false);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Unknown';
  };

  if (loading) {
    return <div className="text-gray-900 text-center py-8">Loading offers...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Product Offers Management</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Offer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) resetForm();
        }}>
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
              </h3>
              <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Product</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Offer Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  placeholder="e.g., Perplexity AI Pro Yearly Account (Global)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Price (LKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Stock Count</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_count}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_count: parseInt(e.target.value) })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Delivery Time</label>
                  <input
                    type="text"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Warranty</label>
                <input
                  type="text"
                  value={formData.warranty}
                  onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter offer description with formatting..."
                  minHeight="150px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={formData.features.join('\n')}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n').filter(f => f.trim()) })}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  placeholder="Private account&#10;Email included&#10;Instant delivery&#10;Full access"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-gray-700 text-xs mt-1">
                  Enter the URL of an image or upload to an image hosting service
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-50 border-gray-300"
                  />
                  Available for Purchase
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Add Offer')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Product</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Offer Title</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Price</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Region</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Stock</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
              <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{getProductName(offer.product_id)}</td>
                <td className="py-3 px-4 text-gray-800">{offer.title}</td>
                <td className="py-3 px-4 text-gray-800">Rs. {offer.price}</td>
                <td className="py-3 px-4 text-gray-800">{offer.region}</td>
                <td className="py-3 px-4 text-gray-800">{offer.stock_count}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      offer.is_available
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}
                  >
                    {offer.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleEdit(offer)}
                    className="text-blue-400 hover:text-blue-300 p-2 inline-flex transition-colors"
                    title="Edit offer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(offer.id)}
                    className="text-red-400 hover:text-red-300 p-2 inline-flex transition-colors"
                    title="Delete offer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {offers.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            No offers found. Add your first offer to get started.
          </div>
        )}
      </div>
    </div>
  );
}
