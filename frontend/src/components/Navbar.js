import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { getCurrentUser, logout } from '../services/authService';
import { PLATFORM, shopLogo, useShop } from '../context/ShopContext';
import '../styles/navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const user = getCurrentUser();
  const { shop } = useShop();
  const brand = shop || PLATFORM;
  const role = user?.role;
  const isPublic = !user || role === 'client';

  const close = () => setExpanded(false);
  const handleLogout = () => {
    close();
    logout();
    navigate('/login');
  };
  const link = (to, label) => <Nav.Link as={NavLink} to={to} end onClick={close}>{label}</Nav.Link>;
  const sectionLink = (hash, label) => {
    const path = `/b/${shop.slug}`;
    const active = location.pathname === path && location.hash === hash;
    return <Nav.Link as={Link} to={`${path}${hash}`} onClick={close} className={active ? 'active' : ''}>{label}</Nav.Link>;
  };

  return (
    <BootstrapNavbar expand="lg" className="custom-navbar" sticky="top" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <BootstrapNavbar.Brand as={Link} to={shop && isPublic ? `/b/${shop.slug}` : '/'} className="brand" onClick={close}>
          <img src={shopLogo(brand)} alt="" className="brand-logo" />
          <span className="brand-text"><strong>{brand.name}</strong><small>{brand.tagline || 'Barbearia'}</small></span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="main-navbar" />
        <BootstrapNavbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-lg-center nav-links">
            {isPublic && shop && sectionLink('#servicos', 'Serviços')}
            {isPublic && shop && sectionLink('#equipe', 'Equipe')}
            {isPublic && link('/', shop ? 'Outras unidades' : 'Barbearias')}
            {role === 'client' && link('/view-appointments', 'Meus horários')}
            {role === 'barber' && link('/view-appointments', 'Minha agenda')}
            {role === 'barber' && link('/financeiro', 'Meus ganhos')}
            {role === 'admin' && link('/admin/barbearias', 'Barbearias')}
            {['admin', 'manager'].includes(role) && link('/admin-dashboard', 'Gestão')}
            {role === 'manager' && link('/minha-barbearia', 'Minha barbearia')}
            {['admin', 'manager'].includes(role) && link('/financeiro', 'Financeiro')}
          </Nav>
          <div className="nav-actions">
            {user ? (
              <>
                {role === 'client' && <Link to={shop ? `/b/${shop.slug}/agendar` : '/'} className="btn nav-cta" onClick={close}>Agendar horário</Link>}
                <button type="button" className="btn nav-logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login" onClick={close}>Entrar</Nav.Link>
                <Link to="/register" className="btn nav-cta" onClick={close}>Criar conta</Link>
              </>
            )}
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
