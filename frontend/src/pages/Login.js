import React from 'react';
import LoginForm from '../components/LoginForm';
import { Container } from 'react-bootstrap';

const Login = () => {
  return (
    <Container className="auth-page"><div className="auth-aside"><span className="eyebrow">BEM-VINDO DE VOLTA</span><h1>Seu estilo<br />espera por você.</h1><p>Entre para acompanhar seus horários e continuar seu ritual.</p><span className="auth-decoration" aria-hidden="true">✳</span></div><section className="auth-panel"><span className="eyebrow">ÁREA DO CLIENTE E EQUIPE</span><h2>Acessar conta</h2><LoginForm /></section></Container>
  );
};

export default Login;
