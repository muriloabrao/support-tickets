import datetime
import streamlit as st
import pandas as pd
from notion_client import Client
import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseUpload
import io
import json

# Carregar variáveis de ambiente
load_dotenv()

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="Ticketeria do Murilo", page_icon="🎫", layout="centered")

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
        creds_info = get_secret("GOOGLE_SERVICE_ACCOUNT")
        if not creds_info:
            creds_path = get_secret("GOOGLE_APPLICATION_CREDENTIALS")
            if creds_path and os.path.exists(creds_path):
                creds = service_account.Credentials.from_service_account_file(creds_path)
            else:
                return None, "Credenciais do Google não configuradas."
        else:
            if isinstance(creds_info, str):
                creds_info = json.loads(creds_info)
            creds = service_account.Credentials.from_service_account_info(creds_info)

        service = build('drive', 'v3', credentials=creds)
        file_metadata = {
            'name': f"ticket_img_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
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
    except:
        return None

notion = get_notion_client()
DATABASE_ID = get_secret("NOTION_DATABASE_ID")

def create_ticket_in_notion(name, email, depto, issue, priority, system, attachment_url=None):
    if not notion or not DATABASE_ID:
        st.error("Erro de conexão com o Notion. Verifique as credenciais.")
        return
    
    ticket_id = f"TICKET-{datetime.datetime.now().strftime('%y%m%d%H%M')}"
    today = datetime.datetime.now().isoformat()
    
    properties = {
        "Name": {"title": [{"text": {"content": name}}]},
        "Ticket ID": {"rich_text": [{"text": {"content": ticket_id}}]},
        "Email": {"email": email}, # Revertido para Email
        "Department": {"select": {"name": depto}},
        "Status": {"status": {"name": "Open"}},
        "Priority": {"select": {"name": priority}},
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

# --- INTERFACE DO USUÁRIO ---
st.title("🎫 Ticketeria do Murilo")
st.markdown("Central de Suporte - Plandoc & MyLims")
st.info("Preencha os campos abaixo para abrir um ticket de suporte.")

with st.form("ticket_form", clear_on_submit=True):
    name = st.text_input("Seu Nome Completo *")
    email = st.text_input("Seu E-mail Corporativo *")
    
    col_a, col_b = st.columns(2)
    with col_a:
        depto = st.selectbox("Seu Departamento *", ["TI", "Engenharia", "Comercial", "Operações", "Financeiro", "RH", "Outro"])
        system = st.selectbox("Sistema com Problema *", ["Plandoc", "Mylims Producer", "Mylims Consumer", "Outro"])
    with col_b:
        priority = st.selectbox("Prioridade *", ["Low", "Medium", "High"])
        uploaded_file = st.file_uploader("Anexar Imagem (Opcional)", type=["png", "jpg", "jpeg"])
        
    issue = st.text_area("Descreva o problema em detalhes *")
    
    submitted = st.form_submit_button("🚀 Enviar Solicitação")

if submitted:
    if not name or not email or not depto or not issue:
        st.error("Por favor, preencha todos os campos obrigatórios (*)")
    else:
        with st.spinner("Enviando seu ticket..."):
            attachment_url = None
            folder_id = get_secret("DRIVE_FOLDER_ID") or "1jBmbD2UlWVRafckTK6A0QYYU4A9VkgMT"
            
            if uploaded_file:
                link, error = upload_to_drive(uploaded_file, folder_id)
                if error:
                    st.error(f"Atenção: O ticket será enviado sem imagem pois o Google Drive recusou o arquivo. Erro: {error}")
                else:
                    attachment_url = link
            
            create_ticket_in_notion(name, email, depto, issue, priority, system, attachment_url)
            st.success("Ticket enviado com sucesso! Verifique seu Notion.")
            st.balloons()
