import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createBarber, updateBarber } from '../services/api';
import BarberAvatar from './BarberAvatar';
import { resizeImage } from '../utils/image';

const emptyBarber = { name: '', email: '', password: '', age: '', hireDate: '', photo: '' };
const BarberModal = ({ show, handleClose, editMode, selectedBarber, barbers, setBarbers, barbershopId }) => {
  const [newBarber, setNewBarber] = useState(emptyBarber);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (editMode && selectedBarber) {
      setNewBarber({
        name: selectedBarber.name,
        email: selectedBarber.email || '',
        password: '',
        age: selectedBarber.age || '',
        hireDate: selectedBarber.hireDate ? selectedBarber.hireDate.split('T')[0] : '',
        photo: selectedBarber.photo || '',
      });
    } else {
      setNewBarber(emptyBarber);
    }
  }, [editMode, selectedBarber, show]);

  const handleChange = (e) => {
    setNewBarber({
      ...newBarber,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const photo = await resizeImage(file, { width: 480, height: 480 });
      setNewBarber(current => ({ ...current, photo }));
      setError('');
    } catch (photoError) {
      setError('Não foi possível ler esta imagem.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedBarber) {
        const updatedBarber = await updateBarber(selectedBarber.id, newBarber);
        setBarbers(barbers.map(barber => (barber.id === selectedBarber.id ? updatedBarber : barber)));
      } else {
        const newBarberData = await createBarber({ ...newBarber, barbershopId });
        if (newBarberData) {
          setBarbers([...barbers, newBarberData]);
        }
      }

      handleClose();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível salvar o barbeiro.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editMode ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="photo-field">
            <BarberAvatar barber={{ name: newBarber.name || '?', photo: newBarber.photo }} size={88} />
            <div>
              <Form.Label className="btn btn-outline-dark btn-sm mb-0">
                {newBarber.photo ? 'Trocar foto' : 'Enviar foto'}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} hidden />
              </Form.Label>
              {newBarber.photo && <Button variant="link" size="sm" className="text-danger" onClick={() => setNewBarber({ ...newBarber, photo: '' })}>Remover</Button>}
              <Form.Text as="p" className="mb-0">JPG, PNG ou WEBP. A imagem é recortada em formato quadrado.</Form.Text>
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={newBarber.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Idade</Form.Label>
            <Form.Control
              type="number"
              name="age"
              value={newBarber.age}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>E-mail de acesso</Form.Label>
            <Form.Control type="email" name="email" value={newBarber.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{editMode ? 'Nova senha (opcional)' : 'Senha inicial'}</Form.Label>
            <Form.Control type="password" name="password" value={newBarber.password} onChange={handleChange} minLength={6} required={!editMode} autoComplete="new-password" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Data de Contratação</Form.Label>
            <Form.Control
              type="date"
              name="hireDate"
              value={newBarber.hireDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            {editMode ? 'Salvar Alterações' : 'Adicionar Barbeiro'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BarberModal;
