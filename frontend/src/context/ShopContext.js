import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchShop } from '../services/api';
import { getCurrentUser } from '../services/authService';

// Marca da rede, usada fora do site de uma barbearia (lista de barbearias, painel do supremo).
export const PLATFORM = { name: 'Mestre dos Penteados', tagline: 'Rede de barbearias', logo: null, contact: {} };

const LAST_SHOP_KEY = 'lastShop';
const STAFF_ROLES = ['admin', 'manager', 'barber'];

const readLastShop = () => {
  try {
    return JSON.parse(localStorage.getItem(LAST_SHOP_KEY) || 'null');
  } catch (error) {
    return null;
  }
};

const ShopContext = createContext({ shop: null, routeShop: null, setRouteShop: () => {}, refreshShop: () => {} });

export const ShopProvider = ({ children }) => {
  const location = useLocation();
  const user = getCurrentUser();
  const [routeShop, setRouteShopState] = useState(null);
  const [homeShop, setHomeShop] = useState(null);
  const [lastShop, setLastShop] = useState(readLastShop);
  // Barbeiro e gerente sempre veem a marca da própria barbearia.
  const homeShopId = ['barber', 'manager'].includes(user?.role) ? user.barbershopId : null;

  const loadHomeShop = useCallback(() => {
    if (!homeShopId) {
      setHomeShop(null);
      return;
    }
    fetchShop(homeShopId).then(setHomeShop).catch(() => setHomeShop(null));
  }, [homeShopId]);

  useEffect(loadHomeShop, [loadHomeShop]);

  const setRouteShop = useCallback((shop) => {
    setRouteShopState(shop);
    if (!shop) return;
    const { id, slug, name, tagline, logo, contact } = shop;
    const summary = { id, slug, name, tagline, logo, contact };
    setLastShop(summary);
    try {
      localStorage.setItem(LAST_SHOP_KEY, JSON.stringify(summary));
    } catch (error) {
      // Sem armazenamento local: a marca só não é lembrada entre páginas.
    }
  }, []);

  const refreshShop = useCallback((updated) => {
    if (routeShop && updated.id === routeShop.id) setRouteShopState(current => ({ ...current, ...updated }));
    if (homeShop && updated.id === homeShop.id) setHomeShop(current => ({ ...current, ...updated }));
    if (lastShop && updated.id === lastShop.id) setRouteShop({ ...lastShop, ...updated });
  }, [routeShop, homeShop, lastShop, setRouteShop]);

  const isStaff = STAFF_ROLES.includes(user?.role);
  const shop = routeShop || homeShop || (!isStaff && location.pathname !== '/' ? lastShop : null);

  const value = useMemo(() => ({ shop, routeShop, lastShop, setRouteShop, refreshShop }), [shop, routeShop, lastShop, setRouteShop, refreshShop]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);

export const shopLogo = (shop) => shop?.logo || `${process.env.PUBLIC_URL}/logo.png`;
