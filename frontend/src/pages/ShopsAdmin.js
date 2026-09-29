import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { createManager, createShop, deleteManager, deleteShop, fetchManagedShops, updateShop } from '../services/api';
import { shopLogo } from '../context/ShopContext';

export const slugify = (text) => text
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  .slice(0, 60);

const emptyShop = { name: '', slug: '', tagline: '' };
const emptyManager = { name: '', email: '', password: '' };
const errorOf = (requestError, fallback) => requestError.response?.data?.error || fallback;

const ShopsAdmin = () => {
  const [shops, setShops] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newShop, setNewShop] = useState(emptyShop);
  const [slugTouched, setSlugTouched] = useState(false);
  const [modalError, setModalError] = useState('');
  const [managersShop, setManagersShop] = useState(null);
  const [newManager, setNewManager] = useState(emptyManager);

  useEffect(() => {
    fetchManagedShops().then(setShops).catch(() => setError('Não foi possível carregar as barbearias.'));
  }, []);

  const replaceShop = (updated) => setShops(items => items.map(item => (item.id === updated.id ? { ...item, ...updated } : item)));

  const openCreate = () => {
    setNewShop(emptyShop);
    setSlugTouched(false);
    setModalError('');
    setCreating(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      const shop = await createShop(newShop);
      setShops(items => [...items, shop].sort((a, b) => a.name.localeCompare(b.name)));
      setCreating(false);
    } catch (requestError) {
      setModalError(errorOf(requestError, 'Não foi possível criar a barbearia.'));
    }
  };

  const toggleActive = async (shop) => {
    try {
      replaceShop(await updateShop(shop.id, { active: !shop.active }));
    } catch (requestError) {
      setError(errorOf(requestError, 'Não foi possível atualizar a barbearia.'));
    }
  };

  const handleDelete = async (shop) => {
    if (!window.confirm(`Excluir a barbearia "${shop.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteShop(shop.id);
      setShops(items => items.filter(item => item.id !== shop.id));
    } catch (requestError) {
      setError(errorOf(requestError, 'Não foi possível excluir a barbearia.'));
    }
  };

  const openManagers = (shop) => {
    setManagersShop(shop);
    setNewManager(emptyManager);
    setModalError('');
  };

  const handleAddManager = async (event) => {
    event.preventDefault();
    try {
      const manager = await createManager(managersShop.id, newManager);
      const updated = { ...managersShop, managers: [...managersShop.managers, manager] };
      setManagersShop(updated);
      replaceShop(updated);
      setNewManager(emptyManager);
      setModalError('');
    } catch (requestError) {
      setModalError(errorOf(requestError, 'Não foi possível criar o gerente.'));
    }
  };

  const handleRemoveManager = async (manager) => {
    if (!window.confirm(`Remover o acesso de ${manager.name}?`)) return;
    try {
      await deleteManager(managersShop.id, manager.id);
      const updated = { ...managersShop, managers: managersShop.managers.filter(item => item.id !== manager.id) };
      setManagersShop(updated);
      replaceShop(updated);
    } catch (requestError) {
      setModalError(errorOf(requestError, 'Não foi possível remover o gerente.'));
    }
  };

  return (
    <main className="container admin-page">
      <header className="page-heading admin-heading panel-heading">
        <div><span className="eyebrow">ADMINISTRAÇÃO GERAL</span><h1>Barbearias</h1><p>Crie unidades, defina gerentes e personalize cada site.</p></div>
        <Button onClick={openCreate}>Nova barbearia <span aria-hidden="true">+</span></Button>
      </header>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <div className="table-wrap">
        <Table responsive hover className="data-table">
          <thead><tr><th>Barbearia</th><th>Endereço</th><th className="num">Barbeiros</th><th>Gerentes</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {shops.map(shop => (
              <tr key={shop.id}>
                <td><div className="table-person"><img src={shopLogo(shop)} alt="" className="table-logo" /><div><strong>{shop.name}</strong><small>{shop.tagline || '—'}</small></div></div></td>
                <td><Link to={`/b/${shop.slug}`} className="table-link">/b/{shop.slug}</Link></td>
                <td className="num">{shop.barberCount}</td>
                <td>{shop.managers.length ? shop.managers.map(manager => manager.name).join(', ') : <span className="text-muted">Sem gerente</span>}</td>
                <td><span className={`status-pill ${shop.active ? '' : 'status-cancelado'}`}>{shop.active ? 'Ativa' : 'Inativa'}</span></td>
                <td>
                  <div className="table-actions">
                    <Button as={Link} to={`/admin/barbearias/${shop.id}`} size="sm" variant="outline-dark">Personalizar</Button>
                    <Button size="sm" variant="outline-dark" onClick={() => openManagers(shop)}>Gerentes</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => toggleActive(shop)}>{shop.active ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(shop)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!shops.length && !error && <p className="table-empty">Nenhuma barbearia cadastrada.</p>}
      </div>

      <Modal show={creating} onHide={() => setCreating(false)} centered>
        <Modal.Header closeButton><Modal.Title>Nova barbearia</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control value={newShop.name} onChange={event => setNewShop({ ...newShop, name: event.target.value, slug: slugTouched ? newShop.slug : slugify(event.target.value) })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Endereço do site</Form.Label>
              <div className="input-prefix"><span>/b/</span><Form.Control value={newShop.slug} onChange={event => { setSlugTouched(true); setNewShop({ ...newShop, slug: slugify(event.target.value) }); }} required /></div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Slogan (opcional)</Form.Label>
              <Form.Control value={newShop.tagline} maxLength={120} onChange={event => setNewShop({ ...newShop, tagline: event.target.value })} placeholder="Ex.: Unidade Centro" />
            </Form.Group>
            <Form.Text as="p">A barbearia começa com o menu de serviços padrão. Depois você pode personalizar logo, serviços e contato.</Form.Text>
            <Button type="submit">Criar barbearia</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={!!managersShop} onHide={() => setManagersShop(null)} centered>
        <Modal.Header closeButton><Modal.Title>Gerentes · {managersShop?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <p className="modal-hint">O gerente administra apenas esta barbearia: equipe, agenda, personalização e financeiro.</p>
          <ul className="manager-list">
            {managersShop?.managers.map(manager => (
              <li key={manager.id}><div><strong>{manager.name}</strong><small>{manager.email}</small></div><Button size="sm" variant="outline-danger" onClick={() => handleRemoveManager(manager)}>Remover</Button></li>
            ))}
            {!managersShop?.managers.length && <li className="text-muted">Nenhum gerente cadastrado.</li>}
          </ul>
          <Form onSubmit={handleAddManager}>
            <h6 className="form-subtitle">Adicionar gerente</h6>
            <Form.Group className="mb-2"><Form.Control placeholder="Nome" value={newManager.name} onChange={event => setNewManager({ ...newManager, name: event.target.value })} required /></Form.Group>
            <Form.Group className="mb-2"><Form.Control type="email" placeholder="E-mail de acesso" value={newManager.email} onChange={event => setNewManager({ ...newManager, email: event.target.value })} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Control type="password" placeholder="Senha inicial (mín. 6 caracteres)" minLength={6} autoComplete="new-password" value={newManager.password} onChange={event => setNewManager({ ...newManager, password: event.target.value })} required /></Form.Group>
            <Button type="submit">Adicionar gerente</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default ShopsAdmin;
