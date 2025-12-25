import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, ArrowLeft, Tag, LogOut, Boxes, Folder, FileText, LayoutGrid, BarChart3, TrendingUp, Trash2, Ticket, Image as ImageIcon, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductManagement from '../components/admin/ProductManagement';
import OrderManagement from '../components/admin/OrderManagement';
import CustomerManagement from '../components/admin/CustomerManagement';
import ProductOfferManagement from '../components/admin/ProductOfferManagement';
import BundleManagement from '../components/admin/BundleManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import FooterManagement from '../components/admin/FooterManagement';
import HomepageSectionManagement from '../components/admin/HomepageSectionManagement';
import TrafficStatistics from '../components/admin/TrafficStatistics';
import OrderStatistics from '../components/admin/OrderStatistics';
import CouponManagement from '../components/admin/CouponManagement';
import BannerManagement from '../components/admin/BannerManagement';
import NoticeBarManagement from '../components/admin/NoticeBarManagement';
import { supabase } from '../lib/supabase';
import { clearAdminSession, getAdminSession, updateSessionActivity } from '../lib/adminAuth';

type TabType = 'products' | 'offers' | 'bundles' | 'categories' | 'homepage' | 'banner' | 'notice' | 'orders' | 'customers' | 'footer' | 'traffic' | 'orderStats' | 'coupons';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const navigate = useNavigate();

  useEffect(() => {
    const trackActivity = () => {
      updateSessionActivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, trackActivity);
    });

    const activityInterval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });
      clearInterval(activityInterval);
    };
  }, []);

  const handleLogout = async () => {
    clearAdminSession();
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the cache? This will refresh the page.')) {
      const adminSession = getAdminSession();

      const keysToKeep = ['admin_session_verified', 'adminAuth'];
      const adminData: { [key: string]: string | null } = {};

      keysToKeep.forEach(key => {
        adminData[key] = localStorage.getItem(key);
      });

      localStorage.clear();
      sessionStorage.clear();

      Object.keys(adminData).forEach(key => {
        if (adminData[key]) {
          localStorage.setItem(key, adminData[key] as string);
        }
      });

      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Site</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-gray-900 font-bold text-xl">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearCache}
                className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear Cache</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('traffic')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'traffic'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Traffic
          </button>
          <button
            onClick={() => setActiveTab('orderStats')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'orderStats'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Order Stats
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'offers'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="w-5 h-5" />
            Offers
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'bundles'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-5 h-5" />
            Bundles
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'coupons'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Ticket className="w-5 h-5" />
            Coupons
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Folder className="w-5 h-5" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'homepage'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Homepage
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'banner'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Banner
          </button>
          <button
            onClick={() => setActiveTab('notice')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'notice'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-5 h-5" />
            Notice Bar
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'customers'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Customers
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'footer'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Footer
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'traffic' && <TrafficStatistics />}
          {activeTab === 'orderStats' && <OrderStatistics />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'offers' && <ProductOfferManagement />}
          {activeTab === 'bundles' && <BundleManagement />}
          {activeTab === 'coupons' && <CouponManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'homepage' && <HomepageSectionManagement />}
          {activeTab === 'banner' && <BannerManagement />}
          {activeTab === 'notice' && <NoticeBarManagement />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'customers' && <CustomerManagement />}
          {activeTab === 'footer' && <FooterManagement />}
        </div>
      </div>
    </div>
  );
}
