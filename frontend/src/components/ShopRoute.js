import React, { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { fetchShop } from '../services/api';
import { useShop } from '../context/ShopContext';

// Carrega a barbearia de /b/:slug e aplica a marca dela no header e no footer.
const ShopRoute = () => {
  const { slug } = useParams();
  const { routeShop, setRouteShop } = useShop();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetchShop(slug)
      .then(shop => {
        if (!active) return;
        setRouteShop(shop);
        setStatus(shop.active ? 'ready' : 'inactive');
      })
      .catch(() => active && setStatus('missing'));
    return () => {
      active = false;
      setRouteShop(null);
    };
  }, [slug, setRouteShop]);

  if (status === 'loading' || (status === 'ready' && routeShop?.slug !== slug)) {
    return <div className="page-loading"><Spinner animation="border" size="sm" /> Carregando…</div>;
  }
  if (status !== 'ready') {
    return (
      <main className="container">
        <div className="empty-state page-message">
          <h2>{status === 'inactive' ? 'Barbearia indisponível' : 'Barbearia não encontrada'}</h2>
          <p>{status === 'inactive' ? 'Esta unidade não está recebendo agendamentos no momento.' : 'Confira o endereço ou escolha outra barbearia.'}</p>
          <Link to="/" className="btn btn-primary">Ver barbearias</Link>
        </div>
      </main>
    );
  }
  return <Outlet />;
};

export default ShopRoute;
