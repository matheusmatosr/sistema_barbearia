import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { loginClient } from '../services/authService';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const HOME_BY_ROLE = { admin: '/admin/barbearias', manager: '/admin-dashboard', barber: '/view-appointments' };

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { lastShop } = useShop();

  const validateForm = () => {
    let valid = true;
    let errors = { email: '', password: '' };

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
    }

    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setMessage('');
    try {
      const user = await loginClient({ email, password });
      setMessage('Login efetuado com sucesso!');
      const from = location.state?.from;
      const home = HOME_BY_ROLE[user.role] || (lastShop ? `/b/${lastShop.slug}` : '/');
      navigate(from ? `${from.pathname}${from.search}` : home, { replace: true });
    } catch (error) {
      setMessage('Login falhou. Por favor, verifique seu e-mail ou senha.');
    }
  };

  const alertVariant = typeof message === 'string' && message.startsWith('Login falhou') ? 'danger' : 'success';

  return (
    <div className="container">
      <Form onSubmit={handleSubmit}>
        {message && <Alert variant={alertVariant}>{message}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            autoComplete="email"
            placeholder="voce@email.com"
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
            value={password}
            autoComplete="current-password"
            placeholder="Sua senha"
            onChange={(e) => setPassword(e.target.value)}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password}
          </Form.Control.Feedback>
        </Form.Group>
        <Button variant="primary" type="submit">Login</Button>
      </Form>
    </div>
  );
};

export default LoginForm;
