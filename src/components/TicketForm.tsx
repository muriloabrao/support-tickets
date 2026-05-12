import React, { useState } from 'react';
import { Upload, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TicketForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: auth.currentUser?.email || '',
    department: '',
    system: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let attachmentUrl = null;

      // Se houver arquivo, faz o upload primeiro
      if (selectedFile) {
        const fileRef = ref(storage, `attachments/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'ep-resolve'), {
        ...formData,
        status: 'Open',
        title: formData.description.substring(0, 50) + (formData.description.length > 50 ? '...' : ''),
        attachmentUrl,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (error: any) {
      console.error("Erro ao salvar ticket: ", error);
      alert("ERRO AO ENVIAR: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg border-4 border-white">✓</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Ticket Enviado com Sucesso!</h2>
        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">Nossa equipe técnica já recebeu sua solicitação e iniciará o atendimento em breve.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-white text-[#0D6081] border-2 border-[#0D6081] font-semibold rounded-xl hover:bg-gray-50 transition-all">Abrir Outro</button>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-[#0D6081] text-white font-semibold rounded-xl hover:bg-[#094a64] hover:shadow-lg transition-all">Acompanhar Status</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D6081]">Abrir Novo Chamado</h1>
        <p className="text-gray-600 mt-2">Relate o problema ou solicitação abaixo com o máximo de detalhes possível.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
            <input 
              required 
              type="text" 
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/80 bg-white/60 focus:bg-white/90 focus:ring-2 focus:ring-[#0D6081]/50 outline-none transition-all placeholder:text-gray-400" 
              placeholder="Ex: João da Silva" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">E-mail Corporativo <span className="text-red-500">*</span></label>
            <input 
              required 
              type="email" 
              readOnly
              value={formData.userEmail}
              className="w-full p-3.5 rounded-xl border border-white/80 bg-gray-100/50 cursor-not-allowed outline-none transition-all text-gray-500" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Departamento <span className="text-red-500">*</span></label>
            <select 
              required 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/80 bg-white/60 focus:bg-white/90 focus:ring-2 focus:ring-[#0D6081]/50 outline-none transition-all text-gray-700"
            >
              <option value="">Selecione seu setor...</option>
              <option>Analítica</option>
              <option>Planejamentos</option>
              <option>Engenharia</option>
              <option>Comercial</option>
              <option>Operações</option>
              <option>Financeiro</option>
              <option>RH</option>
              <option>ADM</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Sistema <span className="text-red-500">*</span></label>
            <select 
              required 
              value={formData.system}
              onChange={(e) => setFormData({...formData, system: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/80 bg-white/60 focus:bg-white/90 focus:ring-2 focus:ring-[#0D6081]/50 outline-none transition-all text-gray-700"
            >
              <option value="">Onde está o problema?</option>
              <option>Plandoc</option>
              <option>Mylims Producer</option>
              <option>Mylims Consumer</option>
              <option>Google AppScripts</option>
              <option>Google Drive</option>
              <option>Outro</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Descrição do Problema <span className="text-red-500">*</span></label>
          <div className="relative">
            <textarea 
              required 
              rows={5} 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/80 bg-white/60 focus:bg-white/90 focus:ring-2 focus:ring-[#0D6081]/50 outline-none transition-all placeholder:text-gray-400 resize-y" 
              placeholder="Descreva em detalhes o que aconteceu, a mensagem de erro (se houver) e o que você estava tentando fazer." 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Anexo de Imagem ou PDF (Opcional)</label>
          <div className={`w-full p-8 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${selectedFile ? 'border-green-400 bg-green-50/30' : 'border-[#0D6081]/30 bg-white/40 hover:bg-white/60'}`}>
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept="image/*,.pdf" 
            />
            <div className={`p-3 rounded-full mb-3 transition-colors shadow-sm ${selectedFile ? 'bg-green-100 text-green-600' : 'bg-white/50 text-[#0D6081] group-hover:bg-white/80'}`}>
               <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-center px-4">
              {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : 'Clique para anexar arquivo ou arraste até aqui'}
            </span>
            <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF até 10MB</span>
          </div>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-[#0D6081] to-[#084259] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 text-lg">
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><Rocket className="w-5 h-5" /> Enviar Solicitação para TI</>
          )}
        </button>
      </form>
    </div>
  );
}
