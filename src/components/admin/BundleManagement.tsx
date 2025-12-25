import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  bundle_price: number;
  is_active: boolean;
  created_at: string;
}

interface BundleWithOffers extends Bundle {
  offers: Array<{
    id: string;
    title: string;
    price: number;
    product_name: string;
  }>;
  total_original_price: number;
  discount: number;
}

interface ProductOffer {
  id: string;
  title: string;
  price: number;
  product_id: string;
  is_available: boolean;
}

interface Product {
  id: string;
  name: string;
}

export default function BundleManagement() {
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<BundleWithOffers[]>([]);
  const [availableOffers, setAvailableOffers] = useState<(ProductOffer & { product_name: string })[]>([]);
  const [editingBundle, setEditingBundle] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bundle_price: '',
    selected_offers: [] as string[],
    is_active: true
  });

  useEffect(() => {
    fetchBundles();
    fetchAvailableOffers();
  }, []);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (bundlesError) throw bundlesError;

      const bundlesWithOffers = await Promise.all(
        (bundlesData || []).map(async (bundle) => {
          const { data: bundleOffersData, error: bundleOffersError } = await supabase
            .from('bundle_offers')
            .select('offer_id')
            .eq('bundle_id', bundle.id);

          if (bundleOffersError) throw bundleOffersError;

          const offerIds = bundleOffersData.map(bo => bo.offer_id);

          if (offerIds.length === 0) {
            return {
              ...bundle,
              offers: [],
              total_original_price: 0,
              discount: 0
            };
          }

          const { data: offersData, error: offersError } = await supabase
            .from('product_offers')
            .select('id, title, price, product_id')
            .in('id', offerIds);

          if (offersError) throw offersError;

          const productIds = [...new Set(offersData.map(o => o.product_id))];
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds);

          if (productsError) throw productsError;

          const productsMap = productsData.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
          }, {} as Record<string, string>);

          const offers = offersData.map(o => ({
            ...o,
            product_name: productsMap[o.product_id] || 'Unknown Product'
          }));

          const total_original_price = offers.reduce((sum, o) => sum + o.price, 0);
          const discount = total_original_price - bundle.bundle_price;

          return {
            ...bundle,
            offers,
            total_original_price,
            discount
          };
        })
      );

      setBundles(bundlesWithOffers);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOffers = async () => {
    try {
      const { data: offersData, error: offersError } = await supabase
        .from('product_offers')
        .select('id, title, price, product_id, is_available')
        .eq('is_available', true);

      if (offersError) throw offersError;

      const productIds = [...new Set(offersData.map(o => o.product_id))];
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (productsError) throw productsError;

      const productsMap = productsData.reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {} as Record<string, string>);

      const offers = offersData.map(o => ({
        ...o,
        product_name: productsMap[o.product_id] || 'Unknown Product'
      }));

      setAvailableOffers(offers);
    } catch (error) {
      console.error('Error fetching available offers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selected_offers.length < 2) {
      alert('Please select at least 2 offers for the bundle');
      return;
    }

    try {
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .insert({
          name: formData.name,
          bundle_price: parseFloat(formData.bundle_price),
          is_active: formData.is_active
        })
        .select()
        .maybeSingle();

      if (bundleError) {
        console.error('Bundle insert error:', bundleError);
        alert(`Failed to create bundle: ${bundleError.message}`);
        return;
      }

      if (!bundleData) {
        alert('Failed to create bundle: No data returned');
        return;
      }

      const bundleOffers = formData.selected_offers.map(offerId => ({
        bundle_id: bundleData.id,
        offer_id: offerId
      }));

      const { error: bundleOffersError } = await supabase
        .from('bundle_offers')
        .insert(bundleOffers);

      if (bundleOffersError) {
        console.error('Bundle offers insert error:', bundleOffersError);
        alert(`Failed to add offers to bundle: ${bundleOffersError.message}`);

        // Clean up the bundle if offers failed
        await supabase.from('bundles').delete().eq('id', bundleData.id);
        return;
      }

      setFormData({
        name: '',
        bundle_price: '',
        selected_offers: [],
        is_active: true
      });
      setShowAddForm(false);
      fetchBundles();
      alert('Bundle created successfully!');
    } catch (error) {
      console.error('Error creating bundle:', error);
      alert(`Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      alert('Failed to delete bundle');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bundles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBundles();
    } catch (error) {
      console.error('Error updating bundle:', error);
      alert('Failed to update bundle status');
    }
  };

  const toggleOfferSelection = (offerId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_offers: prev.selected_offers.includes(offerId)
        ? prev.selected_offers.filter(id => id !== offerId)
        : [...prev.selected_offers, offerId]
    }));
  };

  const calculateTotalPrice = () => {
    return formData.selected_offers.reduce((sum, offerId) => {
      const offer = availableOffers.find(o => o.id === offerId);
      return sum + (offer?.price || 0);
    }, 0);
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">Bundle Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add Bundle'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Offers (minimum 2)
            </label>
            <div className="min-h-[120px] max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
              {availableOffers.length === 0 ? (
                <div className="flex items-center justify-center h-[100px] text-gray-500 text-sm">
                  No available offers found. Please create offers first in the Offers tab.
                </div>
              ) : (
                availableOffers.map(offer => (
                  <label
                    key={offer.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_offers.includes(offer.id)}
                      onChange={() => toggleOfferSelection(offer.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{offer.product_name}</div>
                      <div className="text-xs text-gray-500">
                        {offer.title} - Rs. {offer.price.toFixed(2)}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {formData.selected_offers.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Selected {formData.selected_offers.length} offers
              </div>
              <div className="text-lg font-semibold text-gray-900">
                Total Original Price: Rs. {calculateTotalPrice().toFixed(2)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.bundle_price}
              onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {formData.bundle_price && formData.selected_offers.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                Discount: Rs. {(calculateTotalPrice() - parseFloat(formData.bundle_price)).toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Bundle
          </button>
        </form>
      )}

      <div className="space-y-4">
        {bundles.map(bundle => (
          <div key={bundle.id} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${bundle.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {bundle.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {bundle.offers.length} offers
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(bundle.id, bundle.is_active)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title={bundle.is_active ? 'Deactivate' : 'Activate'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(bundle.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {bundle.offers.map(offer => (
                <div key={offer.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {offer.product_name} - {offer.title}
                  </span>
                  <span className="text-gray-900 font-medium">
                    Rs. {offer.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 line-through">
                  Rs. {bundle.total_original_price.toFixed(2)}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  Rs. {bundle.bundle_price.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600 font-semibold">
                  Save Rs. {bundle.discount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {bundles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No bundles yet. Create your first bundle to get started!
          </div>
        )}
      </div>
    </div>
  );
}
