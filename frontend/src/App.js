import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ShopList from './pages/ShopList';
import Home from './pages/Home';
import RegisterClient from './pages/RegisterClient';
import Login from './pages/Login';
import BookAppointment from './pages/BookAppointment';
import ViewAppointments from './pages/ViewAppointments';
import AdminDashboard from './pages/AdminDashboard';
import FinancialDashboard from './pages/FinancialDashboard';
import ShopsAdmin from './pages/ShopsAdmin';
import ShopSettings from './pages/ShopSettings';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ShopRoute from './components/ShopRoute';
import { ShopProvider } from './context/ShopContext';
import { getCurrentUser } from './services/authService';
import './styles/App.css';

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const user = getCurrentUser();
  if (!localStorage.getItem('token') || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const protect = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

function App() {
  return (
    <Router>
      <ShopProvider>
        <div className="app-container">
          <Navbar />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<ShopList />} />
              <Route path="/b/:slug" element={<ShopRoute />}>
                <Route index element={<Home />} />
                <Route path="agendar" element={protect(['client'], <BookAppointment />)} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterClient />} />
              <Route path="/view-appointments" element={protect(['client', 'barber'], <ViewAppointments />)} />
              <Route path="/admin-dashboard" element={protect(['admin', 'manager'], <AdminDashboard />)} />
              <Route path="/admin/barbearias" element={protect(['admin'], <ShopsAdmin />)} />
              <Route path="/admin/barbearias/:id" element={protect(['admin'], <ShopSettings />)} />
              <Route path="/minha-barbearia" element={protect(['manager'], <ShopSettings />)} />
              <Route path="/financeiro" element={protect(['admin', 'manager', 'barber'], <FinancialDashboard />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </ShopProvider>
    </Router>
  );
}

export default App;
