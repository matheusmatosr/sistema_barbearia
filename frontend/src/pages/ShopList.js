import React, { useEffect, useState } from 'react';
import { Button, Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchShops } from '../services/api';
import { PLATFORM, shopLogo } from '../context/ShopContext';

const ShopList = () => {
  const [shops, setShops] = useState(null);

  useEffect(() => {
    fetchShops().then(setShops).catch(() => setShops([]));
  }, []);

  return (
    <main className="shop-list-page">
      <section className="hero-band shop-list-hero">
        <Container>
          <span className="eyebrow">{PLATFORM.name.toUpperCase()} · {PLATFORM.tagline.toUpperCase()}</span>
          <h1>Escolha sua<br />barbearia.</h1>
          <p>Encontre a unidade mais perto de você, conheça os profissionais e reserve seu horário em poucos cliques.</p>
          {shops?.length === 1
            ? <Button as={Link} to={`/b/${shops[0].slug}/agendar`} className="hero-cta">Agendar meu horário <span aria-hidden="true">↗</span></Button>
            : <Button href="#unidades" className="hero-cta" onClick={(event) => { event.preventDefault(); document.getElementById('unidades')?.scrollIntoView({ behavior: 'smooth' }); }}>Agendar meu horário <span aria-hidden="true">↓</span></Button>}
        </Container>
      </section>
      <Container>
        <section className="home-section" id="unidades">
          <div className="section-heading"><div><span className="eyebrow">NOSSAS UNIDADES</span><h2>Barbearias</h2></div>{shops && <span className="section-count">{String(shops.length).padStart(2, '0')} unidades</span>}</div>
          {!shops ? (
            <div className="page-loading"><Spinner animation="border" size="sm" /> Carregando…</div>
          ) : (
            <div className="shop-grid">
              {shops.map(shop => (
                <Link key={shop.id} to={`/b/${shop.slug}`} className="shop-card">
                  <img src={shopLogo(shop)} alt="" />
                  <div>
                    <h3>{shop.name}</h3>
                    <p>{shop.tagline || 'Barbearia'}</p>
                    {shop.city && <small>{shop.city}</small>}
                  </div>
                  <span className="shop-card-cta">Ver horários <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          )}
          {shops && !shops.length && <p className="table-empty">Nenhuma barbearia disponível no momento.</p>}
        </section>
      </Container>
    </main>
  );
};

export default ShopList;
