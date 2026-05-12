# Backlog de Sprints - EP Resolve

Este documento lista as funcionalidades, ideias e integrações que foram adiadas para sprints futuras, mantendo o foco do MVP.

## 🚨 Prioridade 0: Retorno do Almoço

- **Upload e Exibição de Anexos Oficiais**
  - Configurar e finalizar a integração do Firebase Storage no momento da **abertura do chamado** (arrastar/soltar ou selecionar arquivos no `TicketForm`).
  - Renderizar os anexos enviados na aba **"Informações Gerais"** da tela de Detalhes do Chamado (`TicketDetails`), permitindo o download ou visualização pelos atendentes.

## Sprint 2: Integrações e Experiência do Cliente

- **Integração com Notion (Sync de Banco de Dados)**
  - Substituir o Firebase Firestore como banco de dados principal ou criar uma sincronização bidirecional (Firebase Cloud Functions <-> Notion API).
  - Garantir que tickets abertos no app apareçam imediatamente na base do Notion da equipe.

- **Loop de Feedback e Avaliação (Star Rating)**
  - Enviar um **e-mail automático** para o solicitante assim que o Atendente mudar o status do ticket para "Closed/Resolvido".
  - O e-mail deve conter um link direto para a tela de avaliação.
  - Implementar persistência de cobrança (notificações recorrentes) até que o cliente avalie o atendimento de 1 a 5 estrelas e deixe um comentário (opcional).

- **Upload de Anexos no Formulário Inicial**
  - Implementar a função de arrastar/soltar arquivos (PDF, Imagens) no momento da abertura do chamado (atualmente na interface, mas pendente de lógica de upload no Storage).

## Sprint 3: Gestão e BI

- **Dashboard de Métricas para TI**
  - Tempo médio de resposta (SLA).
  - Tickets por categoria/sistema.
  - Ranking de satisfação do usuário.

- **Sistema de Múltiplos Atendentes (Fila Inteligente)**
  - Expandir o RBAC (Role-Based Access Control) para múltiplos agentes (atualmente apenas `helder.filho@grupoep.com.br`).
  - Lógica de "round-robin" ou "pegar o primeiro da fila".
