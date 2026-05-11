import datetime
import streamlit as st
import pandas as pd
from notion_client import Client
import os
import re
import requests
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseUpload
import io
import json

# Carregar variáveis de ambiente
load_dotenv()

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="EP Resolve", page_icon="logo ep/Cópia de logo oficial.png", layout="centered")

def inject_custom_css():
    st.markdown("""
    <style>
        /* Estilo do Container Principal */
        .block-container {
            padding-top: 2rem;
            padding-bottom: 2rem;
            max-width: 850px;
        }

        /* Estilização de botões - Azul EP */
        .stButton>button {
            width: 100%;
            border-radius: 12px;
            height: 3.5em;
            background-color: #0D6081;
            color: white;
            font-weight: 600;
            border: none;
            transition: all 0.3s ease;
        }
        .stButton>button:hover {
            background-color: #094a64;
            box-shadow: 0 4px 15px rgba(13, 96, 129, 0.3);
            transform: translateY(-2px);
        }

        /* Inputs e TextAreas com cantos suaves */
        .stTextInput>div>div>input, .stTextArea>div>div>textarea {
            border-radius: 10px;
            border: 1px solid #EAEDDD;
        }
    </style>
    """, unsafe_allow_html=True)

inject_custom_css()

# --- FUNÇÃO AUXILIAR PARA SECRETOS ---
def get_secret(key):
    val = os.getenv(key)
    if val: return val
    try:
        return st.secrets.get(key)
    except:
        return None

# --- CONEXÃO COM GOOGLE DRIVE ---
def upload_to_drive(file, folder_id):
    try:
        # Garantir que o ponteiro do arquivo esteja no início
        file.seek(0)
        scopes = ['https://www.googleapis.com/auth/drive']
        creds_info = get_secret("GOOGLE_SERVICE_ACCOUNT")
        
        if not creds_info:
            creds_path = get_secret("GOOGLE_APPLICATION_CREDENTIALS")
            if creds_path and os.path.exists(creds_path):
                creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
            else:
                return None, "Credenciais do Google não configuradas."
        else:
            if isinstance(creds_info, str):
                creds_info = json.loads(creds_info)
            
            # Correção para quebra de linha na private_key (comum no Streamlit Cloud)
            if "private_key" in creds_info:
                creds_info["private_key"] = creds_info["private_key"].replace("\\n", "\n")
                
            creds = service_account.Credentials.from_service_account_info(creds_info, scopes=scopes)

        service = build('drive', 'v3', credentials=creds)
        
        ext = file.name.split('.')[-1] if file.name else 'bin'
        file_metadata = {
            'name': f"ticket_anexo_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}",
            'parents': [folder_id]
        }
        media = MediaIoBaseUpload(io.BytesIO(file.read()), mimetype=file.type, resumable=True)
        uploaded_file = service.files().create(
            body=file_metadata, 
            media_body=media, 
            fields='id',
            supportsAllDrives=True # Permite usar Drive de Equipe
        ).execute()
        
        # Torna o arquivo visível para quem tem o link
        service.permissions().create(
            fileId=uploaded_file['id'], 
            body={'type': 'anyone', 'role': 'reader'},
            supportsAllDrives=True # Permite usar Drive de Equipe
        ).execute()
        return f"https://drive.google.com/uc?id={uploaded_file['id']}", None
    except Exception as e:
        return None, str(e)

# --- CONEXÃO COM NOTION ---
def get_notion_client():
    token = get_secret("NOTION_TOKEN")
    if not token: return None
    try:
        return Client(auth=token)
    except Exception as e:
        print(f"[ERRO] Falha ao conectar com Notion: {e}")
        return None

notion = get_notion_client()
DATABASE_ID = get_secret("NOTION_DATABASE_ID")

def create_ticket_in_notion(name, email, depto, issue, priority, system, attachment_url=None):
    if not notion or not DATABASE_ID:
        raise Exception("Erro de conexão com o Notion. Verifique as credenciais.")
    
    ticket_id = f"TICKET-{datetime.datetime.now().strftime('%y%m%d%H%M')}"
    today = datetime.datetime.now().isoformat()
    
    priority_map = {"Baixa - Não Urgente": "Low", "Média - Importante": "Medium", "Alta - Urgente": "High"}
    notion_priority = priority_map.get(priority, "Low")
    
    properties = {
        "Name": {"title": [{"text": {"content": name}}]},
        "Ticket ID": {"rich_text": [{"text": {"content": ticket_id}}]},
        "Email": {"email": email},
        "Department": {"select": {"name": depto}},
        "Status": {"status": {"name": "Open"}},
        "Priority": {"select": {"name": notion_priority}},
        "System": {"select": {"name": system}},
        "Date Submitted": {"date": {"start": today}}
    }
    
    # Conteúdo da página (Blocos)
    children = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": f"Descrição do Problema: {issue}"}}]
            }
        }
    ]

    if attachment_url:
        properties["Attachment"] = {"url": attachment_url}
        # Adiciona o link no texto
        children.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {"type": "text", "text": {"content": "\n🔗 Link da Imagem: "}},
                    {"type": "text", "text": {"content": "Ver no Drive", "link": {"url": attachment_url}}}
                ]
            }
        })
        # Adiciona a prévia visual
        children.append({
            "object": "block",
            "type": "image",
            "image": {
                "type": "external",
                "external": {"url": attachment_url}
            }
        })

    notion.pages.create(
        parent={"database_id": DATABASE_ID},
        properties=properties,
        children=children
    )
    return ticket_id

# Validar e-mail
def is_valid_email(email):
    """Valida formato básico de email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# --- FUNÇÕES DE FEEDBACK ---
CLOSED_STATUSES = ["Closed", "Resolvido"]

def get_ticket_from_notion(ticket_id):
    """Consulta o Notion pelo Ticket ID. Retorna status atual, page_id e se já foi avaliado."""
    try:
        # Bypassing the Notion SDK entirely and making a direct raw HTTP request
        token = get_secret("NOTION_TOKEN")
        url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
        headers = {
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        payload = {
            "filter": {
                "property": "Ticket ID",
                "rich_text": {"equals": ticket_id}
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            return {"error": f"API Error: {response.text}"}
            
        data = response.json()
        if not data.get("results"):
            return None
            
        page = data["results"][0]
        props = page["properties"]
        status = props.get("Status", {}).get("status", {}).get("name", "")
        rating = props.get("Rating", {}).get("number")
        return {
            "page_id": page["id"],
            "status": status,
            "already_rated": rating is not None,
            "rating_value": rating
        }
    except Exception as e:
        return {"error": str(e)}

def submit_feedback_to_notion(page_id, rating, comment):
    """Atualiza a página do ticket no Notion com avaliação e comentário."""
    properties = {
        "Rating": {"number": rating},
        "Rated At": {"date": {"start": datetime.datetime.now().isoformat()}}
    }
    if comment and comment.strip():
        properties["Feedback"] = {
            "rich_text": [{"type": "text", "text": {"content": comment.strip()}}]
        }
    notion.pages.update(page_id=page_id, properties=properties)

def render_feedback_page(ticket_id):
    """Renderiza a tela de avaliação com base no status atual do ticket no Notion."""
    st.image("logo ep/Cópia de logo oficial.png", width=250)
    st.title("⭐ Avalie seu Atendimento")
    st.markdown(f"Ticket: **`{ticket_id}`**")
    st.markdown("---")

    with st.spinner("Verificando status do chamado..."):
        ticket = get_ticket_from_notion(ticket_id)

    if ticket is None:
        st.error("❌ Ticket não encontrado. Verifique se o ID está correto.")
        return

    if "error" in ticket:
        st.error(f"Erro ao consultar o chamado: {ticket['error']}")
        return

    status = ticket["status"]

    if ticket["already_rated"]:
        nota = int(ticket["rating_value"])
        stars = "★" * nota + "☆" * (5 - nota)
        st.success("🎉 Você já avaliou este chamado!")
        st.markdown(f"### {stars}  ({nota}/5)")
        st.info("Obrigado pelo seu feedback! Ele é muito importante para melhorarmos nosso atendimento.")
        return

    if status not in CLOSED_STATUSES:
        st.warning("⏳ **Seu chamado ainda não foi encerrado.**")
        st.markdown(f"Status atual: **`{status}`**")
        st.info(
            "A avaliação será liberada assim que sua solicitação for marcada como "
            "**Closed** ou **Resolvido**. Guarde este link e volte quando receber "
            "a confirmação de encerramento."
        )
        return

    # Ticket encerrado e ainda não avaliado — exibir formulário
    st.success("✅ Chamado encerrado! Que tal nos contar como foi o atendimento?")
    st.markdown("### Como você avalia o atendimento recebido?")

    rating_options = [
        "★☆☆☆☆  1 — Muito ruim",
        "★★☆☆☆  2 — Ruim",
        "★★★☆☆  3 — Regular",
        "★★★★☆  4 — Bom",
        "★★★★★  5 — Excelente!",
    ]
    rating_values = {label: i + 1 for i, label in enumerate(rating_options)}

    selected_label = st.radio("Sua nota:", rating_options, index=4)
    comment = st.text_area(
        "Deixe um comentário (opcional)",
        placeholder="O que poderia ter sido melhor? O que funcionou bem?",
        max_chars=500
    )

    if st.button("✅ Enviar Avaliação"):
        rating_value = rating_values[selected_label]
        try:
            with st.spinner("Registrando sua avaliação..."):
                submit_feedback_to_notion(ticket["page_id"], rating_value, comment)
            st.success("🙏 Obrigado! Sua avaliação foi registrada com sucesso.")
            st.balloons()
        except Exception as e:
            st.error("😔 Não foi possível registrar sua avaliação. Tente novamente.")
            st.exception(e)

# Offline Check
if not notion or not DATABASE_ID:
    st.error("⚠️ Sistema temporariamente indisponível. Tente novamente em alguns minutos.")
    st.info("📧 Para urgências, envie um email para ti@grupoep.com.br")
    st.stop()

# --- ROTEAMENTO ---
_params = st.query_params
_current_page = _params.get("page", "form")
_ticket_id_param = _params.get("ticket_id", "")

if _current_page == "feedback" and _ticket_id_param:
    render_feedback_page(_ticket_id_param)
    st.stop()

# --- SIDEBAR (Sprint 5) ---
with st.sidebar:
    st.markdown("## 📞 Contato Direto")
    st.markdown("Para emergências, entre em contato:")
    st.markdown("📧 ti@grupoep.com.br")
    st.markdown("---")
    
    st.markdown("## ❓ Perguntas Frequentes")
    with st.expander("Esqueci minha senha do Plandoc"):
        st.markdown("Clique em 'Esqueci minha senha' na tela de login. Se não receber o email em 5 minutos, abra um ticket.")
    with st.expander("O robô não processou minha Cadeia de Custódia"):
        st.markdown("Verifique se o arquivo está no formato PDF e se a leitura está nítida. Se o robô não capturar os dados em 10 minutos, abra um ticket informando o número da amostra.")
    with st.expander("Como acompanho meu chamado?"):
        st.markdown("Após enviar, você receberá um Ticket ID. Use-o para consultar o status no [Painel do Notion](https://www.notion.so/c184c9ec3f9f4d03a5cd472f050afed0?v=c9f02267057e46e5be51d0a1b6451f2d).")
    with st.expander("Posso enviar imagens e prints?"):
        st.markdown("Sim! Use o campo 'Anexar Arquivo' no formulário. Aceitamos imagens, PDFs e vídeos curtos.")
        
    st.markdown("---")
    st.markdown("## 🟢 Status dos Sistemas")
    status = {
        "Plandoc": "🟢 Operacional",
        "Mylims Producer": "🟢 Operacional",
        "Mylims Consumer": "🟢 Operacional",
    }
    for sistema, estado in status.items():
        st.markdown(f"**{sistema}**: {estado}")

# --- INTERFACE DO USUÁRIO ---
st.image("logo ep/Cópia de logo oficial.png", width=250)
st.title("🎫 EP Resolve")
st.markdown("Central Unificada de Suporte - Grupo EP")
st.info("Relate seu problema abaixo e nós cuidaremos do resto.")

with st.form("ticket_form", clear_on_submit=False):
    name = st.text_input("Seu Nome Completo *", help="Ex: João da Silva")
    email = st.text_input("Seu E-mail Corporativo *", help="Ex: joao.silva@grupoep.com.br")
    
    col_a, col_b = st.columns(2)
    with col_a:
        depto = st.selectbox("Seu Departamento *", ["Analítica", "Planejamentos", "Engenharia", "Comercial", "Operações", "Financeiro", "RH", "ADM", "Outro"])
        system = st.selectbox("Sistema com Problema *", ["Plandoc", "Mylims Producer", "Mylims Consumer", "Google AppScripts", "Google Drive", "Outro"])
    with col_b:
        priority = st.selectbox("Prioridade *", ["Baixa - Não Urgente", "Média - Importante", "Alta - Urgente"])
        uploaded_file = st.file_uploader(
            "Anexar Arquivo (Opcional)", 
            type=["png", "jpg", "jpeg", "gif", "webp", "pdf", "mp4"],
            help="Aceita imagens (PNG, JPG, GIF, WebP), PDFs e vídeos curtos (MP4 até 10MB)"
        )
        
    issue = st.text_area("Descreva o problema em detalhes *", help="Quanto mais detalhes, mais rápido resolveremos. Mínimo 20 caracteres.")
    
    submitted = st.form_submit_button("🚀 Enviar Solicitação")

if submitted:
    errors = []
    if not name or len(name.strip().split()) < 2:
        errors.append("Nome completo é obrigatório (nome e sobrenome).")
    if not email or not is_valid_email(email):
        errors.append("E-mail corporativo válido é obrigatório.")
    if len(issue.strip()) < 20:
        errors.append("A descrição deve ter pelo menos 20 caracteres para que possamos entender o problema.")
        
    if uploaded_file and uploaded_file.size > 10 * 1024 * 1024:
        errors.append("O arquivo anexado é muito grande. Tamanho máximo: 10MB.")

    if errors:
        for e in errors:
            st.error(e)
    else:
        with st.spinner("Enviando seu ticket, aguarde até a finalização..."):
            try:
                attachment_url = None
                folder_id = get_secret("DRIVE_FOLDER_ID") or "1jBmbD2UlWVRafckTK6A0QYYU4A9VkgMT"
                
                if uploaded_file:
                    link, error = upload_to_drive(uploaded_file, folder_id)
                    if error:
                        st.warning(f"⚠️ Não foi possível anexar o arquivo, mas seu ticket será enviado normalmente.")
                        st.error(f"Erro técnico do Drive: {error}")
                        print(f"[DRIVE ERROR] {error}")
                    else:
                        attachment_url = link
                
                ticket_id = create_ticket_in_notion(name, email, depto, issue, priority, system, attachment_url)
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
                
                st.markdown("🔗 [Acompanhe todos os chamados no painel do Notion](https://www.notion.so/c184c9ec3f9f4d03a5cd472f050afed0?v=c9f02267057e46e5be51d0a1b6451f2d)")
                st.balloons()

                # --- LINK DE AVALIAÇÃO ---
                st.markdown("---")
                app_url = get_secret("APP_URL") or ""
                feedback_link = f"{app_url}?page=feedback&ticket_id={ticket_id}"
                st.markdown("#### 📣 Avalie nosso atendimento quando o chamado for resolvido")
                st.info(
                    "Quando seu ticket for encerrado, acesse o link abaixo para nos avaliar. "
                    "O formulário só ficará ativo após a resolução."
                )
                st.code(feedback_link, language=None)
            except Exception as e:
                st.error("😔 Não foi possível enviar seu ticket neste momento.")
                st.warning("Tente novamente em alguns minutos. Se o problema persistir, entre em contato diretamente: ti@grupoep.com.br")
                st.exception(e)
