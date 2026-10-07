import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AdminAuthGuard } from './components/admin/AdminAuthGuard';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShoppingBagPage } from './pages/ShoppingBagPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { FootSizeFinderPage } from './pages/FootSizeFinderPage';
import { OutfitMatcherPage } from './pages/OutfitMatcherPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { FAQPage } from './pages/FAQPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { apiService } from './services/api';

// Scroll to Top & Visitor tracking helper on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith('/admin')) {
      apiService.recordSiteVisit();
    }
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-[#565449] selection:text-[#F7F4EB] bg-[#F7F4EB] text-[#1A1A18]">
      {/* Top Navigation Header (Only on public storefront routes) */}
      {!isAdminRoute && <Header />}

      {/* Main Application Dedicated Page Routes */}
      <main className={`flex-1 w-full ${isHomePage ? '' : isAdminRoute ? 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mx-auto'}`}>
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<Navigate to="/products" replace />} />
          <Route path="/bag" element={<ShoppingBagPage />} />
          <Route path="/cart" element={<Navigate to="/bag" replace />} />
          <Route path="/buy" element={<Navigate to="/checkout" replace />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderTrackingPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/customize/*" element={<Navigate to="/products" replace />} />
          <Route path="/customize" element={<Navigate to="/products" replace />} />
          <Route path="/size-finder" element={<FootSizeFinderPage />} />
          <Route path="/foot-size-finder" element={<FootSizeFinderPage />} />
          <Route path="/outfit-match" element={<OutfitMatcherPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faqs" element={<FAQPage />} />
          <Route path="/faq" element={<Navigate to="/faqs" replace />} />
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
            <ScrollToTop />
            <AppContent />
          </CartProvider>
        </AdminAuthProvider>
      </StoreSettingsProvider>
    </Router>
  );
};

export default App;
