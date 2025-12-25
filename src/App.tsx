import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import ProductDetail from './pages/ProductDetail';
import OfferDetail from './pages/OfferDetail';
import CategoryPage from './pages/CategoryPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderPayment from './pages/OrderPayment';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './lib/supabase';

function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

function VisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = () => {
      try {
        const sessionId = getOrCreateSessionId();

        supabase.from('visitor_logs').insert({
          session_id: sessionId,
          page_url: location.pathname + location.search,
          referrer: document.referrer || 'direct',
          user_agent: navigator.userAgent,
          visited_at: new Date().toISOString(),
        }).then(() => {}).catch((error) => {
          console.error('Error tracking visit:', error);
        });
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackVisit();
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <VisitorTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/offer/:slug" element={<OfferDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/pay/:token" element={<OrderPayment />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/myadminaccess" element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
