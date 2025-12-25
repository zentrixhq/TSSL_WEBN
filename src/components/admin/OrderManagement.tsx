import { useState, useEffect } from 'react';
import { Eye, X, Trash2, Plus, Copy, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_contact: string;
  customer_country: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_token?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
  updated_at: string;
}

interface ProductOffer {
  id: string;
  title: string;
  price: number;
}

interface OrderItem {
  offer_id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function OrderManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [productOffers, setProductOffers] = useState<ProductOffer[]>([]);
  const [createdOrderLink, setCreatedOrderLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_email: '',
    customer_contact: '',
    customer_country: '',
    items: [] as OrderItem[],
  });

  useEffect(() => {
    fetchOrders();
    fetchProductOffers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
      setSelectedOrder(null);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const fetchProductOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('product_offers')
        .select('id, title, price')
        .eq('is_available', true)
        .order('title');

      if (error) throw error;
      setProductOffers(data || []);
    } catch (error) {
      console.error('Error fetching product offers:', error);
    }
  };

  const addItemToOrder = (offer: ProductOffer) => {
    const existingItem = newOrder.items.find(item => item.offer_id === offer.id);
    if (existingItem) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(item =>
          item.offer_id === offer.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      setNewOrder({
        ...newOrder,
        items: [
          ...newOrder.items,
          {
            offer_id: offer.id,
            name: offer.title,
            quantity: 1,
            price: offer.price,
          },
        ],
      });
    }
  };

  const removeItemFromOrder = (offerId: string) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.offer_id !== offerId),
    });
  };

  const updateItemQuantity = (offerId: string, quantity: number) => {
    if (quantity < 1) {
      removeItemFromOrder(offerId);
      return;
    }
    setNewOrder({
      ...newOrder,
      items: newOrder.items.map(item =>
        item.offer_id === offerId ? { ...item, quantity } : item
      ),
    });
  };

  const createOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_email || newOrder.items.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    try {
      const totalAmount = newOrder.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          customer_contact: newOrder.customer_contact,
          customer_country: newOrder.customer_country,
          total_amount: totalAmount,
          status: 'pending',
          payment_method: 'pending',
          items: newOrder.items.map(item => ({
            id: item.offer_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })
        .select()
        .single();

      if (error) throw error;

      if (!data || !data.payment_token) {
        throw new Error('Failed to generate payment token');
      }

      const token = typeof data.payment_token === 'string'
        ? data.payment_token
        : data.payment_token.toString();

      const paymentLink = `${window.location.origin}/pay/${token}`;
      setCreatedOrderLink(paymentLink);
      await fetchOrders();

      setNewOrder({
        customer_name: '',
        customer_email: '',
        customer_contact: '',
        customer_country: '',
        items: [],
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const copyPaymentLink = (paymentToken?: string) => {
    let linkToCopy = createdOrderLink;

    if (paymentToken) {
      const token = typeof paymentToken === 'string'
        ? paymentToken
        : String(paymentToken);
      linkToCopy = `${window.location.origin}/pay/${token}`;
    }

    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'awaiting_approval') {
      return order.status === 'pending' && order.payment_method === 'bank_transfer';
    }
    return order.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600/20 text-green-400';
      case 'processing':
        return 'bg-blue-600/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-amber-600/20 text-amber-400';
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
          <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('awaiting_approval')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'awaiting_approval'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Awaiting Approval
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'pending'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'processing'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === 'completed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
          </button>
        </div>
        </div>
      </div>

      {showCreateOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Create New Order</h3>
              <button
                onClick={() => {
                  setShowCreateOrder(false);
                  setCreatedOrderLink(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {createdOrderLink ? (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Created Successfully!</h4>
                  <p className="text-gray-600">Share this payment link with the customer</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Payment Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdOrderLink}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                    />
                    <button
                      onClick={copyPaymentLink}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCreateOrder(false);
                    setCreatedOrderLink(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newOrder.customer_email}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="text"
                      value={newOrder.customer_contact}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_contact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="+94 77 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={newOrder.customer_country}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Sri Lanka"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Order Items <span className="text-red-500">*</span>
                  </h4>

                  {newOrder.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {newOrder.items.map((item) => (
                        <div key={item.offer_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium text-sm">{item.name}</p>
                            <p className="text-gray-600 text-xs">Rs. {item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.offer_id, item.quantity - 1)}
                                className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-gray-900 font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.offer_id, item.quantity + 1)}
                                className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <p className="text-gray-900 font-semibold w-24 text-right">
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeItemFromOrder(item.offer_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900">
                          Rs. {newOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {productOffers.map((offer) => (
                        <button
                          key={offer.id}
                          onClick={() => addItemToOrder(offer)}
                          className="w-full flex items-center justify-between p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-left transition-colors"
                        >
                          <span className="text-gray-900 text-sm">{offer.title}</span>
                          <span className="text-gray-600 text-sm">Rs. {offer.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowCreateOrder(false);
                      setNewOrder({
                        customer_name: '',
                        customer_email: '',
                        customer_contact: '',
                        customer_country: '',
                        items: [],
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createOrder}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Create Order & Generate Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-600 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Order Number</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Order Date</label>
                  <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                  <p className="text-gray-900">
                    {selectedOrder.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment (Stripe)'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
                  <span className={`px-3 py-1 text-sm rounded inline-block ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <p className="text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Contact</label>
                    <p className="text-gray-900">{selectedOrder.customer_contact}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                    <p className="text-gray-900">{selectedOrder.customer_country}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-gray-900 font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-gray-900 font-semibold">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">Rs. {selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.status === 'pending' && selectedOrder.payment_method === 'bank_transfer' && (
                <div className="border-t pt-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Bank Transfer - Awaiting Approval
                    </h4>
                    <p className="text-orange-800 text-sm mb-3">
                      Customer has confirmed bank transfer. Please verify the payment and approve to proceed with the order.
                    </p>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                      Approve Bank Transfer & Start Processing
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.payment_token && (selectedOrder.status === 'pending' || selectedOrder.payment_method === 'pending') && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Payment Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/pay/${typeof selectedOrder.payment_token === 'string' ? selectedOrder.payment_token : String(selectedOrder.payment_token)}`}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm"
                    />
                    <button
                      onClick={() => copyPaymentLink(selectedOrder.payment_token)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Share this link with the customer to complete payment
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Update Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={() => setDeleteConfirm(selectedOrder.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this order? This action cannot be undone and will remove the order from all statistics.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOrder(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Order Number</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Customer</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Items</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
              <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-mono text-xs">
                  {order.order_number}
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-gray-900 text-sm">{order.customer_name}</p>
                    <p className="text-gray-600 text-xs">{order.customer_email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-800">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </td>
                <td className="py-3 px-4 text-gray-800">Rs. {order.total_amount.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    {order.status === 'pending' && order.payment_method === 'bank_transfer' && (
                      <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 font-medium">
                        Needs Approval
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {order.payment_token && (order.status === 'pending' || order.payment_method === 'pending') && (
                      <button
                        onClick={() => copyPaymentLink(order.payment_token)}
                        className="text-green-400 hover:text-green-300 p-2 inline-flex"
                        title="Copy Payment Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-400 hover:text-blue-300 p-2 inline-flex"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(order.id)}
                      className="text-red-400 hover:text-red-300 p-2 inline-flex"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
