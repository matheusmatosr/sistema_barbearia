import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { PLATFORM, shopLogo, useShop } from '../context/ShopContext';
import { getCurrentUser } from '../services/authService';

const Icon = ({ path }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const ICONS = {
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.5h.01',
  whatsapp: 'M3 21l1.7-5A9 9 0 1 1 8 19.3L3 21zM9 8.5c0 3.5 3 6.5 6.5 6.5l1.5-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2L9 8.5z',
  email: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 1l8 7 8-7',
};

// Aceita "@perfil" ou a URL completa do Instagram; telefone vira link do WhatsApp.
const instagramUrl = (value) => (/^https?:\/\//.test(value) ? value : `https://instagram.com/${value.replace(/^@/, '')}`);
const whatsappUrl = (value) => (/^https?:\/\//.test(value) ? value : `https://wa.me/${value.replace(/\D/g, '')}`);

const Footer = () => {
  const { shop } = useShop();
  const user = getCurrentUser();
  const brand = shop || PLATFORM;
  const contact = brand.contact || {};
  const isPublic = !user || user.role === 'client';
  const base = shop ? `/b/${shop.slug}` : '';
  const hasContact = ['address', 'city', 'phone', 'email'].some(field => contact[field]);

  return (
    <footer className="footer">
      <Container>
        <div className={`footer-grid${hasContact ? '' : ' no-contact'}`}>
          <div className="footer-brand">
            <Link to={shop && isPublic ? base : '/'} className="footer-logo">
              <img src={shopLogo(brand)} alt="" />
              <span>{brand.name}</span>
            </Link>
            <p>{brand.tagline ? `${brand.tagline}. ` : ''}Atendimento com hora marcada, profissionais experientes e atenção a cada detalhe do seu estilo.</p>
            <div className="footer-social">
              {contact.instagram && <a href={instagramUrl(contact.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon path={ICONS.instagram} /></a>}
              {contact.whatsapp && <a href={whatsappUrl(contact.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon path={ICONS.whatsapp} /></a>}
              {contact.email && <a href={`mailto:${contact.email}`} aria-label="E-mail"><Icon path={ICONS.email} /></a>}
            </div>
          </div>

          <div>
            <h4>Navegação</h4>
            <ul>
              {shop && isPublic && <li><Link to={`${base}#servicos`}>Serviços</Link></li>}
              {shop && isPublic && <li><Link to={`${base}#equipe`}>Equipe</Link></li>}
              {shop && isPublic && <li><Link to={`${base}/agendar`}>Agendar horário</Link></li>}
              <li><Link to="/">{shop ? 'Outras unidades' : 'Barbearias'}</Link></li>
              {(!user || ['client', 'barber'].includes(user.role)) && <li><Link to="/view-appointments">{user?.role === 'barber' ? 'Minha agenda' : 'Meus horários'}</Link></li>}
            </ul>
          </div>

          <div>
            <h4>Horário</h4>
            <ul className="footer-hours">
              <li><span>Atendimento</span><strong>08h – 18h</strong></li>
              <li><span>Duração</span><strong>30 min</strong></li>
              <li><span>Agendamento</span><strong>Online</strong></li>
            </ul>
          </div>

          {hasContact && (
            <div>
              <h4>Contato</h4>
              <ul>
                {contact.address && <li>{contact.address}</li>}
                {contact.city && <li>{contact.city}</li>}
                {contact.phone && <li><a href={`tel:${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</a></li>}
                {contact.email && <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
              </ul>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.</span>
          <span>Precisão em cada detalhe.</span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
