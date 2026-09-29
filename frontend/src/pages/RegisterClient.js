import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { registerClient } from '../services/api';
import { loginClient } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const RegisterClient = () => {
  const navigate = useNavigate();
  const { lastShop } = useShop();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
  });

  const validateForm = () => {
    let valid = true;
    let errors = { name: '', email: '', password: '' };

    if (!name.trim()) {
      errors.name = 'O nome é obrigatório.';
      valid = false;
    }

    if (!email.trim()) {
      errors.email = 'O e-mail é obrigatório.';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'O e-mail deve ser válido.';
      valid = false;
    }

    if (!password.trim()) {
      errors.password = 'A senha é obrigatória.';
      valid = false;
    } else if (password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres.';
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setMessage('');
    try {
      await registerClient({ name, email, password });
      await loginClient({ email, password });
      setMessage('Cadastrado com sucesso!');
      navigate(lastShop ? `/b/${lastShop.slug}` : '/');
    } catch (error) {
      setMessage(`Erro: ${error.response?.data?.error || 'Não foi possível criar a conta.'}`);
    }
  };

  const alertVariant = typeof message === 'string' && message.startsWith('Erro') ? 'danger' : 'success';

  return (
    <div className="container auth-page"><div className="auth-aside"><span className="eyebrow">BOM CORTE MUDA TUDO</span><h1>O próximo<br />capítulo começa<br />na cadeira.</h1><p>Crie sua conta e escolha quando quer renovar o visual.</p><span className="auth-decoration" aria-hidden="true">✳</span></div><section className="auth-panel">
      <span className="eyebrow">NOVO POR AQUI?</span><h2>Criar conta</h2>
      <Form onSubmit={handleSubmit}>
        {message && <Alert variant={alertVariant}>{message}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isInvalid={!!errors.name}
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isInvalid={!!errors.email}
          />
          <Form.Control.Feedback type="invalid">
            {errors.email}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Senha</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password}
          </Form.Control.Feedback>
        </Form.Group>
        <Button variant="primary" type="submit">Criar minha conta <span aria-hidden="true">↗</span></Button>
      </Form>
      <p className="auth-switch">Já tem conta? <Link to="/login">Entrar</Link></p>
    </section></div>
  );
};

export default RegisterClient;
