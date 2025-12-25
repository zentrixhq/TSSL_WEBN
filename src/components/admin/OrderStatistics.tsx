import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, ShoppingCart, Package, TrendingUp, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  ordersByStatus: { status: string; count: number; revenue: number }[];
  ordersByPaymentMethod: { method: string; count: number; revenue: number }[];
  recentOrders: any[];
  topCustomers: { name: string; email: string; orders: number; revenue: number }[];
  salesByDay: { date: string; orders: number; revenue: number }[];
}

export default function OrderStatistics() {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    ordersByStatus: [],
    ordersByPaymentMethod: [],
    recentOrders: [],
    topCustomers: [],
    salesByDay: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!orders) return;

      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const ordersToday = orders.filter(o => new Date(o.created_at) >= startOfToday);
      const ordersWeek = orders.filter(o => new Date(o.created_at) >= startOfWeek);
      const ordersMonth = orders.filter(o => new Date(o.created_at) >= startOfMonth);

      const validOrders = orders.filter(o => o.status === 'completed' || o.status === 'processing');
      const validOrdersToday = ordersToday.filter(o => o.status === 'completed' || o.status === 'processing');
      const validOrdersWeek = ordersWeek.filter(o => o.status === 'completed' || o.status === 'processing');
      const validOrdersMonth = ordersMonth.filter(o => o.status === 'completed' || o.status === 'processing');

      const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const revenueToday = validOrdersToday.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const revenueWeek = validOrdersWeek.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const revenueMonth = validOrdersMonth.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const statusMap = new Map<string, { count: number; revenue: number }>();
      orders.forEach(o => {
        const status = o.status || 'unknown';
        const existing = statusMap.get(status) || { count: 0, revenue: 0 };
        statusMap.set(status, {
          count: existing.count + 1,
          revenue: existing.revenue + ((o.status === 'completed' || o.status === 'processing') ? (o.total_amount || 0) : 0),
        });
      });

      const paymentMap = new Map<string, { count: number; revenue: number }>();
      orders.forEach(o => {
        if (o.status === 'completed' || o.status === 'processing') {
          const method = o.payment_method || 'unknown';
          const existing = paymentMap.get(method) || { count: 0, revenue: 0 };
          paymentMap.set(method, {
            count: existing.count + 1,
            revenue: existing.revenue + (o.total_amount || 0),
          });
        }
      });

      const customerMap = new Map<string, { name: string; orders: number; revenue: number }>();
      orders.forEach(o => {
        if (o.status === 'completed' || o.status === 'processing') {
          const email = o.customer_email || 'unknown';
          const existing = customerMap.get(email) || { name: o.customer_name || 'Unknown', orders: 0, revenue: 0 };
          customerMap.set(email, {
            name: existing.name,
            orders: existing.orders + 1,
            revenue: existing.revenue + (o.total_amount || 0),
          });
        }
      });

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const salesByDayMap = new Map<string, { orders: number; revenue: number }>();
      orders.forEach(o => {
        if (o.status === 'completed' || o.status === 'processing') {
          const date = new Date(o.created_at).toISOString().split('T')[0];
          const existing = salesByDayMap.get(date) || { orders: 0, revenue: 0 };
          salesByDayMap.set(date, {
            orders: existing.orders + 1,
            revenue: existing.revenue + (o.total_amount || 0),
          });
        }
      });

      const salesByDay = last30Days.map(date => ({
        date,
        orders: salesByDayMap.get(date)?.orders || 0,
        revenue: salesByDayMap.get(date)?.revenue || 0,
      }));

      setStats({
        totalOrders: validOrders.length,
        totalRevenue,
        averageOrderValue: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
        ordersToday: validOrdersToday.length,
        ordersThisWeek: validOrdersWeek.length,
        ordersThisMonth: validOrdersMonth.length,
        revenueToday,
        revenueThisWeek: revenueWeek,
        revenueThisMonth: revenueMonth,
        ordersByStatus: Array.from(statusMap.entries()).map(([status, data]) => ({
          status,
          count: data.count,
          revenue: data.revenue,
        })),
        ordersByPaymentMethod: Array.from(paymentMap.entries()).map(([method, data]) => ({
          method,
          count: data.count,
          revenue: data.revenue,
        })),
        recentOrders: orders.slice(0, 10),
        topCustomers: Array.from(customerMap.entries())
          .map(([email, data]) => ({ email, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        salesByDay,
      });
    } catch (error) {
      console.error('Error fetching order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-green-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Orders Today</p>
              <p className="text-3xl font-bold mt-2">{stats.ordersToday}</p>
            </div>
            <Calendar className="w-10 h-10 text-orange-100 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Today</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.revenueToday)}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.ordersToday} orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">This Week</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenueThisWeek)}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.ordersThisWeek} orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">This Month</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenueThisMonth)}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.ordersThisMonth} orders</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Trend (Last 30 Days)</h3>
        <div className="space-y-2">
          <div className="flex gap-1 items-end h-48">
            {stats.salesByDay.map((day, index) => {
              const maxRevenue = Math.max(...stats.salesByDay.map(d => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div>{new Date(day.date).toLocaleDateString()}</div>
                    <div>{formatCurrency(day.revenue)}</div>
                    <div>{day.orders} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Orders by Status
          </h3>
          <div className="space-y-3">
            {stats.ordersByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.status === 'delivered' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {item.status === 'cancelled' && <XCircle className="w-5 h-5 text-red-600" />}
                  {item.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Methods
          </h3>
          <div className="space-y-3">
            {stats.ordersByPaymentMethod.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{item.method}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(item.revenue)}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {stats.topCustomers.length === 0 ? (
              <p className="text-gray-500 text-sm">No customer data available yet</p>
            ) : (
              stats.topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.revenue)}</p>
                    <p className="text-xs text-gray-500">{customer.orders} orders</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders yet</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
