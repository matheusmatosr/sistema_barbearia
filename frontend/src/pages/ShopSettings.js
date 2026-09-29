import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { fetchManagedShops, updateShop } from '../services/api';
import { getCurrentUser } from '../services/authService';
import { shopLogo, useShop } from '../context/ShopContext';
import { resizeImage } from '../utils/image';
import { slugify } from './ShopsAdmin';

const CONTACT_FIELDS = [
  { key: 'address', label: 'Endereço', placeholder: 'Rua, número · bairro' },
  { key: 'city', label: 'Cidade', placeholder: 'Cidade - UF' },
  { key: 'phone', label: 'Telefone', placeholder: '(00) 00000-0000' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'Número com DDD ou link wa.me' },
  { key: 'instagram', label: 'Instagram', placeholder: '@perfil' },
  { key: 'email', label: 'E-mail', placeholder: 'contato@barbearia.com' },
];

const newService = () => ({ key: `novo-${Date.now()}`, name: '', description: '', price: '', image: null });

const ShopSettings = () => {
  const { id } = useParams();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const shopId = Number(isAdmin ? id : user?.barbershopId);
  const { refreshShop } = useShop();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchManagedShops()
      .then(shops => {
        const shop = shops.find(item => item.id === shopId);
        if (!shop) {
          setStatus({ type: 'danger', text: 'Barbearia não encontrada.' });
          return;
        }
        setForm({
          ...shop,
          tagline: shop.tagline || '',
          contact: shop.contact || {},
          commission: Math.round(shop.commissionRate * 100),
          services: shop.services.map(service => ({ ...service, key: service.id })),
        });
      })
      .catch(() => setStatus({ type: 'danger', text: 'Não foi possível carregar a barbearia.' }));
  }, [shopId]);

  if (!form) {
    return <main className="container admin-page">{status.text ? <Alert variant="danger" className="mt-5">{status.text}</Alert> : <div className="page-loading"><Spinner animation="border" size="sm" /> Carregando…</div>}</main>;
  }

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const setContact = (field, value) => setForm(current => ({ ...current, contact: { ...current.contact, [field]: value } }));
  const setService = (key, field, value) => setForm(current => ({
    ...current,
    services: current.services.map(service => (service.key === key ? { ...service, [field]: value } : service)),
  }));
  const moveService = (index, offset) => setForm(current => {
    const services = [...current.services];
    const [item] = services.splice(index, 1);
    services.splice(index + offset, 0, item);
    return { ...current, services };
  });

  const pickImage = async (event, options, apply) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      apply(await resizeImage(file, options));
    } catch (error) {
      setStatus({ type: 'danger', text: 'Não foi possível ler esta imagem.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const updated = await updateShop(form.id, {
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        logo: form.logo || null,
        contact: form.contact,
        commissionRate: Number(form.commission) / 100,
        services: form.services.map(({ name, description, price, image }) => ({ name, description, price: Number(price), image })),
      });
      setForm(current => ({ ...current, ...updated, services: updated.services.map(service => ({ ...service, key: service.id })) }));
      refreshShop(updated);
      setStatus({ type: 'success', text: 'Alterações salvas. O site da barbearia já está atualizado.' });
    } catch (requestError) {
      setStatus({ type: 'danger', text: requestError.response?.data?.error || 'Não foi possível salvar as alterações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container admin-page settings-page">
      <header className="page-heading admin-heading panel-heading">
        <div><span className="eyebrow">PERSONALIZAÇÃO</span><h1>{isAdmin ? form.name : 'Minha barbearia'}</h1><p>Marca, contato e menu de serviços exibidos no site <Link to={`/b/${form.slug}`} className="table-link">/b/{form.slug}</Link>.</p></div>
        {isAdmin && <Button as={Link} to="/admin/barbearias" variant="outline-dark">← Barbearias</Button>}
      </header>

      <Form onSubmit={handleSubmit}>
        <section className="finance-card settings-section">
          <div className="section-heading"><div><span className="eyebrow">IDENTIDADE</span><h2>Nome e logo</h2></div></div>
          <div className="settings-identity">
            <div className="header-preview" aria-label="Prévia do header">
              <img src={shopLogo(form)} alt="" />
              <span><strong>{form.name || 'Nome da barbearia'}</strong><small>{form.tagline || 'Barbearia'}</small></span>
            </div>
            <div className="settings-logo-actions">
              <Form.Label className="btn btn-outline-dark btn-sm mb-0">
                {form.logo ? 'Trocar logo' : 'Enviar logo'}
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => pickImage(event, { width: 256, height: 256, type: 'image/png' }, logo => set('logo', logo))} />
              </Form.Label>
              {form.logo && <Button variant="link" size="sm" className="text-danger" onClick={() => set('logo', null)}>Usar logo padrão</Button>}
              <Form.Text as="p">Formato quadrado; a imagem é recortada no centro.</Form.Text>
            </div>
          </div>
          <div className="settings-grid">
            <Form.Group><Form.Label>Nome no header</Form.Label><Form.Control value={form.name} maxLength={80} onChange={event => set('name', event.target.value)} required /></Form.Group>
            <Form.Group><Form.Label>Slogan</Form.Label><Form.Control value={form.tagline} maxLength={120} placeholder="Ex.: Barbearia · Est. 2018" onChange={event => set('tagline', event.target.value)} /></Form.Group>
            <Form.Group><Form.Label>Endereço do site</Form.Label><div className="input-prefix"><span>/b/</span><Form.Control value={form.slug} onChange={event => set('slug', slugify(event.target.value))} required /></div><Form.Text>Ao mudar, o link antigo deixa de funcionar.</Form.Text></Form.Group>
          </div>
        </section>

        <section className="finance-card settings-section">
          <div className="section-heading"><div><span className="eyebrow">MENU</span><h2>Serviços</h2></div><Button variant="outline-dark" size="sm" onClick={() => set('services', [...form.services, newService()])}>Adicionar serviço +</Button></div>
          <div className="service-editor">
            {form.services.map((service, index) => (
              <div className="service-row" key={service.key}>
                <label className="service-row-image" style={service.image ? { backgroundImage: `url(${service.image})` } : undefined}>
                  <span>{service.image ? 'Trocar imagem' : 'Enviar imagem'}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => pickImage(event, { width: 800, height: 500 }, image => setService(service.key, 'image', image))} />
                </label>
                <div className="service-row-fields">
                  <div className="service-row-top">
                    <Form.Control aria-label="Nome do serviço" placeholder="Nome do serviço" value={service.name} maxLength={60} onChange={event => setService(service.key, 'name', event.target.value)} required />
                    <div className="input-prefix price-input"><span>R$</span><Form.Control aria-label="Preço" type="number" min="0" step="0.01" value={service.price} onChange={event => setService(service.key, 'price', event.target.value)} required /></div>
                  </div>
                  <Form.Control aria-label="Descrição" placeholder="Descrição curta" value={service.description} maxLength={200} onChange={event => setService(service.key, 'description', event.target.value)} />
                </div>
                <div className="service-row-actions">
                  <Button size="sm" variant="outline-secondary" aria-label="Mover para cima" disabled={index === 0} onClick={() => moveService(index, -1)}>↑</Button>
                  <Button size="sm" variant="outline-secondary" aria-label="Mover para baixo" disabled={index === form.services.length - 1} onClick={() => moveService(index, 1)}>↓</Button>
                  <Button size="sm" variant="outline-danger" aria-label="Remover serviço" disabled={form.services.length === 1} onClick={() => set('services', form.services.filter(item => item.key !== service.key))}>✕</Button>
                </div>
              </div>
            ))}
          </div>
          <Form.Text as="p" className="mt-3">Os preços valem para novos agendamentos; os já feitos mantêm o valor da reserva.</Form.Text>
        </section>

        <div className="finance-columns">
          <section className="finance-card settings-section">
            <div className="section-heading"><div><span className="eyebrow">RODAPÉ</span><h2>Contato</h2></div></div>
            <div className="settings-grid is-two">
              {CONTACT_FIELDS.map(field => (
                <Form.Group key={field.key}><Form.Label>{field.label}</Form.Label><Form.Control value={form.contact[field.key] || ''} placeholder={field.placeholder} maxLength={200} onChange={event => setContact(field.key, event.target.value)} /></Form.Group>
              ))}
            </div>
          </section>
          <section className="finance-card settings-section">
            <div className="section-heading"><div><span className="eyebrow">FINANCEIRO</span><h2>Comissão</h2></div></div>
            <Form.Group>
              <Form.Label>Parte do barbeiro em cada atendimento</Form.Label>
              <div className="input-suffix"><Form.Control type="number" min="0" max="100" step="1" value={form.commission} onChange={event => set('commission', event.target.value)} required /><span>%</span></div>
            </Form.Group>
            <div className="commission-split">
              <div style={{ width: `${Math.min(Math.max(Number(form.commission) || 0, 0), 100)}%` }} />
            </div>
            <p className="commission-legend"><span><i className="is-barber" />Barbeiro {Number(form.commission) || 0}%</span><span><i className="is-house" />Casa {100 - (Number(form.commission) || 0)}%</span></p>
          </section>
        </div>

        <div className="settings-savebar">
          {status.text && <Alert variant={status.type} className="mb-0">{status.text}</Alert>}
          <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</Button>
        </div>
      </Form>
    </main>
  );
};

export default ShopSettings;
