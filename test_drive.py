import os
import json
import io
import datetime
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

load_dotenv()

def get_secret(key):
    return os.getenv(key)

def upload_to_drive_test():
    try:
        creds_path = get_secret("GOOGLE_APPLICATION_CREDENTIALS")
        print(f"Creds path: {creds_path}")
        if not creds_path or not os.path.exists(creds_path):
            print("Creds path does not exist")
            return
        
        creds = service_account.Credentials.from_service_account_file(creds_path)
        service = build('drive', 'v3', credentials=creds)
        
        folder_id = get_secret("DRIVE_FOLDER_ID")
        print(f"Folder ID: {folder_id}")
        
        file_metadata = {
            'name': f"test_upload_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            'parents': [folder_id]
        }
        media = MediaIoBaseUpload(io.BytesIO(b"Hello World"), mimetype='text/plain', resumable=True)
        uploaded_file = service.files().create(
            body=file_metadata, 
            media_body=media, 
            fields='id',
            supportsAllDrives=True
        ).execute()
        print(f"Success! File ID: {uploaded_file['id']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    upload_to_drive_test()
