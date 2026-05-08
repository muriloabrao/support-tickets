# 🎫 EP Resolve — SPRINTS DE IMPLEMENTAÇÃO

> **Objetivo**: Transformar o app de "protótipo funcional" em "ferramenta profissional" para lançamento no Grupo EP.
>
> **Arquivo principal**: `support-tickets/streamlit_app.py`
>
> **Stack**: Streamlit (Python) + Notion API + Google Drive API
>
> **Regra de ouro**: NÃO quebre o que já funciona. Cada sprint deve ser testável isoladamente.

---

## 📋 CONTEXTO DO PROJETO

### O que o app faz hoje
- Formulário Streamlit para abertura de chamados de suporte
- Campos: Nome, Email, Departamento, Sistema, Prioridade, Descrição, Anexo (imagem)
- Envia os dados para um banco Notion via API
- Faz upload de imagens para o Google Drive (Shared Drive)
- Exibe confirmação com link para o Notion

### Arquivos importantes
| Arquivo | Função |
|---|---|
| `support-tickets/streamlit_app.py` | App principal (176 linhas) |
| `support-tickets/requirements.txt` | Dependências Python |
| `support-tickets/.streamlit/` | Configurações do Streamlit (vazia por enquanto) |
| `support-tickets/.env` | Variáveis de ambiente locais |
| `credenciais streamlit.toml` | Credenciais para o Streamlit Cloud (NÃO commitar) |

### Integrações ativas
- **Notion**: Token `NOTION_TOKEN`, Database `NOTION_DATABASE_ID`
- **Google Drive**: Service Account via `GOOGLE_SERVICE_ACCOUNT` ou `GOOGLE_APPLICATION_CREDENTIALS`
- **Folder ID do Drive**: `DRIVE_FOLDER_ID`

---

## 🏃 SPRINT 1 — Visual & Branding (Prioridade MÁXIMA)

### Objetivo
Dar identidade visual profissional ao app. O usuário deve abrir e pensar "isso é uma ferramenta oficial do Grupo EP".

### Tarefas

#### 1.1 — Criar tema Streamlit
- Criar o arquivo `support-tickets/.streamlit/config.toml`
- Definir cores do tema alinhadas com o manual da marca (Azul EP).
- Estrutura recomendada:
```toml
[theme]
primaryColor = "#0D6081"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#EAEDDD"
textColor = "#474749"
font = "sans serif"
```

#### 1.2 — Adicionar CSS customizado via `st.markdown`
- Inserir bloco `st.markdown(unsafe_allow_html=True)` logo após o `set_page_config`
- Estilizar:
  - Header com a cor Azul EP (#0D6081)
  - Botão de submit com a cor Azul EP (#0D6081) e hover
  - Cards/containers com bordas arredondadas (12px) e fundo Cinza Claro (#EAEDDD)
- **NÃO remover** nenhum componente funcional existente

#### 1.3 — Logo e título
- Adicionar logo do Grupo EP no topo: `support-tickets/logo ep/Cópia de logo oficial.png`
- Usar `st.image(logo_path, width=250)` no topo centralizado.

#### 1.4 — Favicon
- O `page_icon` já é "🎫" — avaliar se faz sentido trocar por logo EP
- Se tiver um `.ico` ou `.png` da logo, usar como favicon

### Critério de conclusão
- [ ] App abre com visual profissional e cores corporativas
- [ ] Logo visível no topo
- [ ] Botões e formulário estilizados
- [ ] Nenhuma funcionalidade quebrada

---

## 🏃 SPRINT 2 — Localização PT-BR Completa (Prioridade MÁXIMA)

### Objetivo
Todos os textos visíveis ao usuário devem estar em português brasileiro. Sem exceção.

### Tarefas

#### 2.1 — Traduzir prioridades
Substituir no `st.selectbox` de prioridade:
```python
# DE:
priority = st.selectbox("Prioridade *", ["Low", "Medium", "High"])

# PARA:
priority = st.selectbox("Prioridade *", ["🟢 Baixa", "🟡 Média", "🔴 Alta"])
```

> **ATENÇÃO**: O valor enviado para o Notion precisa continuar compatível com a propriedade "Priority" do banco. Duas opções:
> 1. Criar um mapeamento `{"🟢 Baixa": "Low", ...}` e enviar o valor em inglês para o Notion
> 2. OU renomear os valores de Select no próprio Notion para PT-BR
>
> **Recomendação**: Opção 1 (mapeamento) — não depende de alterar o Notion.

#### 2.2 — Traduzir status
O status "Open" enviado ao Notion pode ser mantido em inglês (é interno), mas se quiser traduzir:
```python
"Status": {"status": {"name": "Aberto"}}
```
> Só funciona se o status "Aberto" existir no Notion. Verificar antes.

#### 2.3 — Revisar todas as mensagens
Verificar e traduzir (se necessário):
- `st.error(...)` — já estão em PT ✅
- `st.success(...)` — já está em PT ✅
- `st.info(...)` — já está em PT ✅
- `st.spinner(...)` — já está em PT ✅
- Labels dos campos — já estão em PT ✅
- Placeholder/help text — adicionar `help=` nos campos para guiar o usuário

#### 2.4 — Adicionar textos de ajuda nos campos
```python
name = st.text_input("Seu Nome Completo *", help="Ex: João da Silva")
email = st.text_input("Seu E-mail Corporativo *", help="Ex: joao.silva@grupoep.com.br")
issue = st.text_area("Descreva o problema em detalhes *", help="Quanto mais detalhes, mais rápido resolveremos. Mínimo 20 caracteres.")
```

### Critério de conclusão
- [ ] Zero textos em inglês na interface
- [ ] Prioridades exibidas em PT-BR com emojis de cor
- [ ] Valores enviados ao Notion continuam compatíveis
- [ ] Textos de ajuda (help) em todos os campos

---

## 🏃 SPRINT 3 — Validação de Campos (Prioridade ALTA)

### Objetivo
Evitar tickets inválidos, incompletos ou com dados lixo.

### Tarefas

#### 3.1 — Validação de email
```python
import re

def is_valid_email(email):
    """Valida formato básico de email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
```
- Aplicar no bloco `if submitted:`
- Exibir: `st.error("Por favor, insira um e-mail válido (ex: nome@grupoep.com.br)")`
- **Opcional**: Restringir apenas domínios `@grupoep.com.br` — depende se terceiros também usarão

#### 3.2 — Validação de descrição (mínimo de caracteres)
```python
if len(issue.strip()) < 20:
    st.error("A descrição deve ter pelo menos 20 caracteres para que possamos entender o problema.")
```

#### 3.3 — Validação de nome (pelo menos nome e sobrenome)
```python
if len(name.strip().split()) < 2:
    st.error("Por favor, insira seu nome completo (nome e sobrenome).")
```

#### 3.4 — Reorganizar bloco de validação
Atualmente a validação é:
```python
if not name or not email or not depto or not issue:
```
Substituir por validações individuais com mensagens específicas, usando uma lista de erros:
```python
errors = []
if not name or len(name.strip().split()) < 2:
    errors.append("Nome completo é obrigatório (nome e sobrenome).")
if not email or not is_valid_email(email):
    errors.append("E-mail corporativo válido é obrigatório.")
if len(issue.strip()) < 20:
    errors.append("Descrição deve ter pelo menos 20 caracteres.")

if errors:
    for e in errors:
        st.error(e)
else:
    # prosseguir com envio...
```

### Critério de conclusão
- [ ] Email inválido é rejeitado com mensagem clara
- [ ] Descrição curta demais é rejeitada
- [ ] Nome incompleto é rejeitado
- [ ] Cada erro tem sua própria mensagem específica

---

## 🏃 SPRINT 4 — Feedback Pós-Envio Melhorado (Prioridade ALTA)

### Objetivo
Após enviar o ticket, o usuário deve ter certeza absoluta de que funcionou e saber como acompanhar.

### Tarefas

#### 4.1 — Retornar o Ticket ID gerado
A função `create_ticket_in_notion` atualmente não retorna nada. Modificar para retornar o `ticket_id`:
```python
def create_ticket_in_notion(name, email, depto, issue, priority, system, attachment_url=None):
    # ... (código existente) ...
    ticket_id = f"TICKET-{datetime.datetime.now().strftime('%y%m%d%H%M')}"
    # ... (código existente) ...
    notion.pages.create(...)
    return ticket_id  # <-- ADICIONAR
```

#### 4.2 — Exibir resumo do ticket enviado
Após o `st.success`, adicionar:
```python
ticket_id = create_ticket_in_notion(...)
st.success(f"✅ Ticket **{ticket_id}** enviado com sucesso!")

with st.expander("📋 Resumo do seu chamado", expanded=True):
    st.markdown(f"""
    | Campo | Valor |
    |---|---|
    | **Ticket ID** | `{ticket_id}` |
    | **Nome** | {name} |
    | **Email** | {email} |
    | **Sistema** | {system} |
    | **Prioridade** | {priority} |
    | **Departamento** | {depto} |
    | **Data** | {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')} |
    """)
    st.info("💡 Guarde seu Ticket ID para acompanhar o status.")
```

#### 4.3 — Melhorar o link do Notion
Substituir o link hardcoded por uma mensagem mais elegante:
```python
st.markdown("🔗 [Acompanhe todos os chamados no painel do Notion](https://www.notion.so/c184c9ec3f9f4d03a5cd472f050afed0?v=c9f02267057e46e5be51d0a1b6451f2d)")
```

### Critério de conclusão
- [ ] Ticket ID exibido de forma destacada após envio
- [ ] Resumo completo do chamado visível
- [ ] Link do Notion apresentado de forma limpa
- [ ] `st.balloons()` mantido (feedback visual positivo)

---

## 🏃 SPRINT 5 — Sidebar com FAQ e Informações (Prioridade MÉDIA)

### Objetivo
Reduzir tickets desnecessários e dar contexto ao usuário.

### Tarefas

#### 5.1 — Criar sidebar
```python
with st.sidebar:
    st.image("logo.png", width=200)  # ou st.markdown com emoji
    st.markdown("## 📞 Contato Direto")
    st.markdown("Para emergências, entre em contato:")
    st.markdown("📧 suporte@grupoep.com.br")
    st.markdown("---")
```

#### 5.2 — FAQ rápido
```python
with st.sidebar:
    st.markdown("## ❓ Perguntas Frequentes")

    with st.expander("Esqueci minha senha do Plandoc"):
        st.markdown("Clique em 'Esqueci minha senha' na tela de login. Se não receber o email em 5 minutos, abra um ticket.")

    with st.expander("Mylims não está carregando"):
        st.markdown("Tente limpar o cache do navegador (Ctrl+Shift+Delete) e acessar novamente. Se persistir, abra um ticket.")

    with st.expander("Como acompanho meu chamado?"):
        st.markdown("Após enviar, você receberá um Ticket ID. Use-o para consultar o status no painel do Notion.")

    with st.expander("Posso enviar imagens e prints?"):
        st.markdown("Sim! Use o campo 'Anexar Imagem' no formulário. Aceitamos PNG, JPG e JPEG.")
```

#### 5.3 — Status dos sistemas (manual)
```python
with st.sidebar:
    st.markdown("---")
    st.markdown("## 🟢 Status dos Sistemas")
    status = {
        "Plandoc": "🟢 Operacional",
        "Mylims Producer": "🟢 Operacional",
        "Mylims Consumer": "🟢 Operacional",
    }
    for sistema, estado in status.items():
        st.markdown(f"**{sistema}**: {estado}")
```

> **Nota para o agente**: Este status é manual. Futuramente pode ser automatizado com health checks, mas por hora um dicionário estático resolve.

### Critério de conclusão
- [ ] Sidebar visível com FAQ (mínimo 3 perguntas)
- [ ] Status dos sistemas exibido
- [ ] Contato de emergência visível
- [ ] Layout principal não foi afetado

---

## 🏃 SPRINT 6 — Tratamento de Erros Robusto (Prioridade MÉDIA)

### Objetivo
Nenhum erro técnico deve aparecer para o usuário final. Tudo deve ser traduzido em mensagem amigável.

### Tarefas

#### 6.1 — Wrap da função de envio com try/except
```python
if submitted and not errors:
    with st.spinner("Enviando seu ticket, aguarde..."):
        try:
            # upload de imagem...
            # criação do ticket...
            ticket_id = create_ticket_in_notion(...)
            st.success(f"✅ Ticket **{ticket_id}** enviado com sucesso!")
        except Exception as e:
            st.error("😔 Não foi possível enviar seu ticket neste momento.")
            st.warning("Tente novamente em alguns minutos. Se o problema persistir, entre em contato diretamente: suporte@grupoep.com.br")
            # Log técnico (não visível ao usuário em produção)
            st.exception(e)  # Remover em produção ou usar logging
```

#### 6.2 — Melhorar a `get_notion_client`
```python
def get_notion_client():
    token = get_secret("NOTION_TOKEN")
    if not token:
        return None
    try:
        return Client(auth=token)
    except Exception as e:
        print(f"[ERRO] Falha ao conectar com Notion: {e}")  # Log interno
        return None
```

#### 6.3 — Verificação de conexão no início
```python
# Após instanciar o Notion client
if not notion or not DATABASE_ID:
    st.error("⚠️ Sistema temporariamente indisponível. Tente novamente em alguns minutos.")
    st.info("📧 Para urgências, envie um email para suporte@grupoep.com.br")
    st.stop()  # Impede o resto da página de carregar
```

#### 6.4 — Melhorar erro de upload de imagem
O tratamento atual já é razoável, mas melhorar a mensagem:
```python
if error:
    st.warning(f"⚠️ Não foi possível anexar a imagem, mas seu ticket será enviado normalmente.")
    # Log técnico
    print(f"[DRIVE ERROR] {error}")
```

### Critério de conclusão
- [ ] Nenhum traceback Python visível ao usuário
- [ ] Todas as falhas têm mensagem amigável em PT-BR
- [ ] App mostra tela de indisponibilidade se Notion estiver offline
- [ ] Erros de upload não bloqueiam o envio do ticket

---

## 🏃 SPRINT 7 — Aceitar Mais Tipos de Anexo (Prioridade BAIXA)

### Objetivo
Ampliar os tipos de arquivo aceitos no upload.

### Tarefas

#### 7.1 — Expandir tipos aceitos
```python
uploaded_file = st.file_uploader(
    "Anexar Arquivo (Opcional)",
    type=["png", "jpg", "jpeg", "gif", "webp", "pdf", "mp4"],
    help="Aceita imagens (PNG, JPG, GIF, WebP), PDFs e vídeos curtos (MP4 até 10MB)"
)
```

#### 7.2 — Validar tamanho
```python
if uploaded_file and uploaded_file.size > 10 * 1024 * 1024:  # 10MB
    st.error("O arquivo é muito grande. Tamanho máximo: 10MB.")
```

#### 7.3 — Ajustar nome do arquivo no Drive
O nome atual assume `.png`. Corrigir:
```python
# DE:
'name': f"ticket_img_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"

# PARA:
ext = uploaded_file.name.split('.')[-1] if uploaded_file.name else 'bin'
'name': f"ticket_anexo_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
```

### Critério de conclusão
- [ ] Upload aceita PNG, JPG, GIF, WebP, PDF e MP4
- [ ] Arquivos maiores que 10MB são rejeitados com mensagem
- [ ] Extensão correta no Google Drive

---

## 📐 ORDEM DE EXECUÇÃO RECOMENDADA

```
Sprint 2 (PT-BR)     →  mais rápido, menos risco
Sprint 3 (Validação)  →  depende só do Sprint 2 para labels
Sprint 4 (Feedback)   →  independente
Sprint 1 (Visual)     →  pode ser feito em paralelo, mas testar por último
Sprint 6 (Erros)      →  independente
Sprint 5 (Sidebar)    →  independente
Sprint 7 (Anexos)     →  independente, menor prioridade
```

> [!IMPORTANT]
> **Após cada Sprint**, rode o app localmente com `streamlit run streamlit_app.py` e teste:
> 1. O formulário abre sem erros?
> 2. O envio funciona?
> 3. O ticket aparece no Notion?
> 4. O visual está correto?

---

## 🚫 O QUE NÃO FAZER

1. **NÃO** adicionar autenticação (confirmado pelo Murilo que não é necessário agora)
2. **NÃO** mudar a estrutura do banco Notion sem confirmar
3. **NÃO** commitar credenciais — verificar `.gitignore`
4. **NÃO** instalar dependências novas sem necessidade (tudo aqui usa Streamlit nativo)
5. **NÃO** remover comentários existentes no código
6. **NÃO** alterar a lógica de upload do Google Drive (já funciona com Shared Drives)

---

## ✅ CHECKLIST FINAL PRÉ-LANÇAMENTO

- [ ] Todos os textos em PT-BR
- [ ] Visual profissional com cores corporativas
- [ ] Validação de email, nome e descrição
- [ ] Feedback pós-envio com Ticket ID e resumo
- [ ] Sidebar com FAQ e status
- [ ] Erros tratados com mensagens amigáveis
- [ ] Testado localmente com envio real
- [ ] Credenciais NÃO estão no Git
- [ ] `requirements.txt` atualizado (se adicionou algo)
- [ ] Commit final com mensagem descritiva
