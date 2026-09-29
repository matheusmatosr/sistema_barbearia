import React, { useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import BarberCard from '../components/BarberCard';
import ServiceCard from '../components/ServiceCard';
import { getCurrentUser } from '../services/authService';
import { useShop } from '../context/ShopContext';

const Home = () => {
  const { routeShop: shop } = useShop();
  const { hash } = useLocation();
  const user = getCurrentUser();
  const canBook = !user || user.role === 'client';
  // Visitante vai para o login e volta direto ao agendamento com a escolha mantida.
  const bookingLink = (param = '') => `/b/${shop.slug}/agendar${param ? `?${param}` : ''}`;
  const slotMinutes = shop.schedule?.slotMinutes || 30;

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <main className="home-page">
      <section className="hero-band"><Container className="hero-content">
        <div className="hero-copy"><span className="eyebrow">{shop.name.toUpperCase()}{shop.tagline ? ` · ${shop.tagline.toUpperCase()}` : ''}</span><h1>Seu próximo<br />grande corte.</h1><p>Barbearia de verdade, atendimento com hora marcada e profissionais que entendem do assunto.</p>{canBook && <Button as={Link} to={bookingLink()} className="hero-cta">Reservar meu horário <span aria-hidden="true">↗</span></Button>}<div className="hero-note"><span className="hero-dot" /> Agenda aberta para novos clientes</div></div>
        <div className="hero-art" role="img" aria-label="Interior contemporâneo de uma barbearia"><div className="hero-art-label"><span>01 / 03</span><strong>O ritual começa aqui.</strong></div></div>
        <div className="hero-stamp" aria-hidden="true"><span>ESTILO</span><strong>COM<br />ATITUDE</strong><i>✳</i></div>
      </Container></section>

      <Container>
        <section className="home-section" id="servicos">
          <div className="section-heading"><div><span className="eyebrow">NOSSO MENU</span><h2>Serviços</h2></div><span className="section-count">Atendimentos de {slotMinutes} min</span></div>
          <div className="service-grid">
            {shop.services.map(service => (
              <ServiceCard key={service.id} service={service} duration={slotMinutes} to={canBook ? bookingLink(`service=${service.id}`) : undefined} />
            ))}
          </div>
        </section>

        <section className="home-section" id="equipe">
          <div className="section-heading"><div><span className="eyebrow">MÃOS DE MESTRE</span><h2>Quem cuida do seu estilo</h2></div><span className="section-count">{String(shop.barbers.length).padStart(2, '0')} profissionais</span></div>
          <div className="barber-grid">{shop.barbers.map(barber => <BarberCard key={barber.id} barber={barber} to={canBook ? bookingLink(`barber=${barber.id}`) : undefined} />)}</div>
          {!shop.barbers.length && <p className="table-empty">Nossa equipe está sendo atualizada. Volte em breve.</p>}
        </section>
      </Container>
    </main>
  );
};

export default Home;
