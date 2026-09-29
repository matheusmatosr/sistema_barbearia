import React from 'react';
import { Form } from 'react-bootstrap';

// Seletor de barbearia do painel. Só aparece para o supremo; o gerente fica preso à própria.
const ShopSelect = ({ shops, value, onChange, allowAll = false }) => {
  if (shops.length <= 1 && !allowAll) return null;
  return (
    <Form.Group className="shop-select">
      <Form.Label>Barbearia</Form.Label>
      <Form.Select value={value || ''} onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}>
        {allowAll && <option value="">Todas as barbearias</option>}
        {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}{shop.active ? '' : ' (inativa)'}</option>)}
      </Form.Select>
    </Form.Group>
  );
};

export default ShopSelect;
