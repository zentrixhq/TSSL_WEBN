import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { supabase, Customer, Order } from '../../lib/supabase';

export default function CustomerManagement() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer.id);
  };

  const getTotalSpent = () => {
    return customerOrders.reduce((sum, order) => sum + order.total_amount, 0);
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <div className="text-gray-600">
          Total Customers: <span className="text-gray-900 font-semibold">{customers.length}</span>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Customer Details</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-600 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <p className="text-gray-900 text-lg">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                    <p className="text-gray-900">{selectedCustomer.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
                    <p className="text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Order</label>
                    <p className="text-gray-900">
                      {selectedCustomer.last_order_at
                        ? new Date(selectedCustomer.last_order_at).toLocaleDateString()
                        : 'No orders yet'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                  <p className="text-gray-900 text-2xl font-bold">{customerOrders.length}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Spent</p>
                  <p className="text-gray-900 text-2xl font-bold">Rs. {getTotalSpent().toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
                  <p className="text-gray-900 text-2xl font-bold">
                    Rs. {customerOrders.length > 0 ? (getTotalSpent() / customerOrders.length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-900 font-semibold mb-4">Order History</h4>
                {customerOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-600 text-sm font-medium">Date</th>
                          <th className="text-left py-2 px-3 text-gray-600 text-sm font-medium">Product</th>
                          <th className="text-left py-2 px-3 text-gray-600 text-sm font-medium">Quantity</th>
                          <th className="text-left py-2 px-3 text-gray-600 text-sm font-medium">Amount</th>
                          <th className="text-left py-2 px-3 text-gray-600 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-200">
                            <td className="py-2 px-3 text-gray-800 text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 text-gray-900 text-sm">{order.product?.name || 'N/A'}</td>
                            <td className="py-2 px-3 text-gray-800 text-sm">{order.quantity}</td>
                            <td className="py-2 px-3 text-gray-800 text-sm">Rs. {order.total_amount}</td>
                            <td className="py-2 px-3 text-sm">
                              <span className={`px-2 py-1 text-xs rounded ${
                                order.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                order.status === 'processing' ? 'bg-blue-600/20 text-blue-400' :
                                order.status === 'cancelled' ? 'bg-red-600/20 text-red-400' :
                                'bg-amber-600/20 text-amber-400'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-700 text-center py-8">No orders yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Email</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Phone</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Joined</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Last Order</th>
              <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{customer.name}</td>
                <td className="py-3 px-4 text-gray-800">{customer.email}</td>
                <td className="py-3 px-4 text-gray-800">{customer.phone || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {customer.last_order_at
                    ? new Date(customer.last_order_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleViewCustomer(customer)}
                    className="text-blue-400 hover:text-blue-300 p-2 inline-flex"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
