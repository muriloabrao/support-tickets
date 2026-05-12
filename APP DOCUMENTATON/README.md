# 📊 Guia de Relatórios e Métricas - EP Resolve

Este documento descreve o funcionamento do módulo de Analytics (Relatórios) do EP Resolve, detalhando o racional de cálculo por trás de cada indicador e gráfico.

## 🎯 Objetivo
O dashboard de relatórios foi projetado para fornecer visibilidade total sobre a eficiência da operação de TI, permitindo identificar gargalos, medir o nível de serviço (SLA) e a satisfação do usuário final.

> [!IMPORTANT]
> **Acesso Restrito:** Esta tela é visível exclusivamente para usuários listados como atendentes/gestores no sistema.

---

## 📈 Indicadores Principais (KPIs)

### 1. Total de Chamados
- **O que é:** Volume bruto de solicitações criadas no período selecionado.
- **Racional:** Soma simples de todos os documentos na coleção de tickets filtrados pela data de criação.

### 2. Tempo Médio de Resolução (TTR)
- **O que é:** O tempo total que um usuário espera desde o momento da abertura até o encerramento do ticket.
- **Cálculo:** `Média(resolvedAt - createdAt)`
- **Unidade:** Minutos, Horas ou Dias.

### 3. Tempo de Primeira Resposta (FRT)
- **O que é:** Tempo que o ticket permaneceu "Na Fila" aguardando o primeiro contato ou atribuição de um atendente.
- **Cálculo:** `Média(assignedAt - createdAt)`
- **Importância:** Mede a responsividade da equipe.

### 4. Taxa de Resolução
- **O que é:** Percentual de chamados concluídos em relação ao total aberto.
- **Cálculo:** `(Tickets Status="Closed" / Total de Tickets) * 100`

---

## 🕒 Acordos de Nível de Serviço (SLA)

### SLA Compliance (Meta: 24h)
- **Racional:** Verifica quantos tickets foram resolvidos em menos de 24 horas corridas.
- **Cálculo:** `(Tickets com TTR <= 24h / Total de Tickets Concluídos) * 100`
- **Visualização:** Gauge circular que muda de cor (Verde > 80%, Amarelo > 50%, Vermelho < 50%).

---

## 📂 Visões Operacionais

### Volume por Status
- **Filtro:** Agrupamento por `status` (Open, In Progress, Closed).
- **Utilidade:** Visão instantânea da saúde da fila atual.

### Volume por Sistema e Departamento
- **Racional:** Agrupamento por campos categóricos preenchidos no formulário de abertura.
- **Utilidade:** Identifica quais sistemas (ex: Plandoc, Mylims) ou setores (ex: Comercial, Engenharia) estão gerando mais demanda.

### Tickets por Atendente
- **Racional:** Contagem de chamados atribuídos por `assignedToName`.
- **Utilidade:** Ajuda a equilibrar a carga de trabalho entre a equipe técnica.

---

## 🛡️ Gestão de Backlog e Qualidade

### Backlog Envelhecendo (Aging)
- **O que é:** Lista os tickets em aberto há mais tempo.
- **Cálculo:** `Data Atual - createdAt`.
- **Alertas Visuais:**
    - 🟢 < 24h
    - 🟡 > 24h
    - 🔴 > 72h

### Satisfação (CSAT)
- **O que é:** Média das notas (1 a 5 estrelas) deixadas pelos usuários após o encerramento.
- **Cálculo:** `Média(feedbackRating)`.
- **Fonte:** Dados coletados via componente de Feedback.

---

## 🛠️ Filtros de Período
O dashboard permite filtrar os dados em 4 janelas temporais baseadas no campo `createdAt`:
- **7 dias:** Visão tática/semanal.
- **30 dias:** Visão mensal padrão.
- **90 dias:** Visão trimestral de tendências.
- **Tudo:** Histórico completo da base.

---

## ⏱️ Tempos Detalhados

Esta seção no rodapé do relatório isola o tempo de "burocracia/espera" do tempo de "trabalho real".

### 1. Tempo de Atendimento (Handle Time)
- **Racional:** Média de quanto tempo o atendente levou para resolver o problema **após clicar em "Atender"**.
- **Cálculo:** `Média(resolvedAt - assignedAt)`.
- **Nota sobre dados legados:** Chamados abertos antes da implementação desta métrica exibirão um traço (`—`), pois o campo de data de atribuição não existia no banco de dados anteriormente.

### 2. Em Aberto
- **Racional:** Soma de todos os tickets que estão nos status **"Na Fila"** (Open) ou **"Em Atendimento"** (In Progress).
- **Utilidade:** Indica o tamanho atual do backlog (trabalho pendente).

### 3. Concluídos
- **Racional:** Contagem total de tickets que chegaram ao status **"Resolvido"** dentro do período selecionado.

---

## 💡 Exemplo Prático de Ciclo de Vida

Para um chamado com os seguintes marcos:
1. **08:00** - Usuário abre o ticket (**createdAt**).
2. **09:00** - Atendente clica em Atender (**assignedAt**).
3. **09:30** - Atendente clica em Encerrar (**resolvedAt**).

**Os resultados seriam:**
- **Primeira Resposta:** 1 hora (tempo de espera na fila).
- **Tempo de Atendimento:** 30 minutos (tempo efetivo de suporte).
- **Tempo de Resolução (TTR):** 1 hora e 30 minutos (experiência total do usuário).

---

© 2024 EP Resolve | Tecnologia Grupo EP
