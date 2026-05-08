# 🎨 Skill: UI/UX Expert for Streamlit (Refinada)

> **Perfil**: Arquiteto de Interface Sênior especializado em transformar scripts Python/Streamlit em SPAs (Single Page Applications) de alto padrão corporativo.

## 🧠 Lógica de Design (Thinking Process)

Sempre que o usuário solicitar uma interface ou melhoria, o agente deve:

1. **Análise de Fluxo**: Identificar se a hierarquia de informações está clara.
2. **Aplicação de Branding**: Integrar as cores do Grupo EP de forma equilibrada (60% Neutro, 30% Primário, 10% Acento).
3. **Refatoração Estética**: Substituir componentes brutos por versões estilizadas via CSS Injected.

## 🛠️ Toolbox Técnica

### 1. Sistema de Injeção Modular

Não injete todo o CSS de uma vez se não for necessário. O agente deve usar este template base, adaptando os seletores conforme o componente:

```python
def apply_ep_theme():
    st.markdown(f"""
    <style>
        /* Global & Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        html, body, [class*="css"] {{ font-family: 'Inter', sans-serif; }}

        /* Container & Cards */
        .main .block-container {{ padding: 3rem 1rem; max-width: 900px; }}
        
        /* Estilização de Botões (Padrão EP) */
        div.stButton > button {{
            border: none;
            background-color: #0D6081;
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            transition: 0.3s;
            width: 100%;
        }}
        div.stButton > button:hover {{
            background-color: #094a64;
            box-shadow: 0 4px 12px rgba(13, 96, 129, 0.2);
        }}

        /* Inputs Modernos */
        .stTextInput input, .stTextArea textarea {{
            border: 1px solid #EAEDDD !important;
            border-radius: 8px !important;
        }}
    </style>
    """, unsafe_allow_html=True)

```

### 2. Paleta de Cores Estratégica (Variáveis)

O agente deve priorizar o uso das cores conforme a semântica:

* **Primária**: `#0D6081` (Ações principais, Headers)
* **Background**: `#EAEDDD` (Fundo de cards ou áreas de destaque)
* **Status**: `#C2063D` (Erro), `#327A2D` (Sucesso), `#F7B607` (Alertas)
* **Texto**: `#474749` (Contraste alto para leitura)

## 🏗️ Layout Patterns (EP Resolve)

Ao trabalhar no projeto **EP Resolve**, o agente deve obrigatoriamente:

* **Header**: Criar um container no topo com a logo centralizada/alinhada e um subtítulo cinza.
* **Cards**: Usar `st.container()` com bordas customizadas para agrupar formulários de tickets.
* **Métricas**: Estilizar `st.metric` para que usem o Azul EP no rótulo.

## 📝 Regras de Ouro de UX para o Agente

1. **Whitespace**: Nunca deixe componentes colados. Use `st.write("")` ou paddings no CSS.
2. **Feedback**: Todo processamento (`st.button`) deve vir acompanhado de um `st.spinner` ou `st.toast` estilizado.
3. **Mobile-First**: Verificar se o uso de colunas `st.columns` não quebrará a leitura em telas pequenas.

---