# Mestre dos Penteados

Sistema web de agendamento para barbearia, com áreas separadas para clientes, barbeiros e administração.

## Funcionalidades

### Site e menu de serviços
- Página inicial com apresentação da barbearia, menu de serviços e equipe.
- Menu de serviços padrão, com imagem ilustrativa, descrição, preço e duração. Todos os barbeiros realizam todos os serviços.
- Cartões da equipe com foto de cada barbeiro. Clicar em um serviço ou em um barbeiro abre o agendamento com a escolha já selecionada.

### Cliente
- Cadastro e login.
- Agendamento em etapas: escolha do serviço, do barbeiro, do dia em um calendário e do horário.
- Apenas horários livres podem ser escolhidos: atendimentos de 30 minutos, das 08h às 18h, sem conflito com a agenda do barbeiro.
- "Meus horários": lista dos agendamentos com status, opção de **editar** (trocar serviço, barbeiro, dia ou horário) e de cancelar, com até 2 horas de antecedência.

### Barbeiro
- Acesso com e-mail e senha definidos pelo administrador.
- "Minha agenda": atendimentos do próprio barbeiro, com atualização de status (Agendado, Em atendimento, Concluído, Cancelado).
- "Meus ganhos": faturamento gerado, comissão recebida e parte da casa, com gráfico mensal, comparação com o mês anterior e resumo por serviço.

### Administrador
- Gestão da equipe: cadastro, edição e remoção de barbeiros, com envio de foto.
- Visão geral da agenda e dos clientes, com cancelamento de horários.
- Painel financeiro: faturamento bruto, repasse aos barbeiros (custo de comissão), lucro da casa, ticket médio e atendimentos concluídos.
- Gráfico comparando os últimos 12 meses, detalhamento por barbeiro e por serviço e histórico mensal.
- Divisão configurável de cada atendimento entre barbeiro e casa (padrão: 50% / 50%).

### Segurança
- Autenticação por token e permissões verificadas na API para cada perfil.
- Senhas armazenadas com hash; dados sensíveis não são expostos nas respostas.

## Tecnologias

- **Frontend:** React, React Router, React Bootstrap.
- **Backend:** Node.js, Express, Sequelize.
- **Banco de dados:** PostgreSQL (Supabase).
