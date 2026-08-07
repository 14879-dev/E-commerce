import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AdminAuthGuard } from './components/admin/AdminAuthGuard';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { ShoppingBagPage } from './pages/ShoppingBagPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CustomizerPage } from './pages/CustomizerPage';
import { FootSizeFinderPage } from './pages/FootSizeFinderPage';
import { OutfitMatcherPage } from './pages/OutfitMatcherPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Scroll to Top helper on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-blue-600 selection:text-white bg-white">
      {/* Top Navigation Header (Only on public storefront routes) */}
      {!isAdminRoute && <Header />}

      {/* Main Application Dedicated Page Routes */}
      <main className={`flex-1 w-full mx-auto ${isAdminRoute ? 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/bag" element={<ShoppingBagPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderTrackingPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/customize/:productId" element={<CustomizerPage />} />
          <Route path="/customize" element={<CustomizerPage />} />
          <Route path="/size-finder" element={<FootSizeFinderPage />} />
          <Route path="/outfit-match" element={<OutfitMatcherPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* Admin Login — Public (no guard) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Dashboard — Protected by Auth Guard */}
          <Route
            path="/admin/*"
            element={
              <AdminAuthGuard>
                <AdminDashboard />
              </AdminAuthGuard>
            }
          />
        </Routes>
      </main>

      {/* Global Footer (Only on public storefront routes) */}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <StoreSettingsProvider>
        <AdminAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AdminAuthProvider>
      </StoreSettingsProvider>
    </Router>
  );
};

export default App;
