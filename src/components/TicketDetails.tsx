import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, User, MessageSquare, Info, CheckCircle, Hand, Image as ImageIcon, Upload } from 'lucide-react';

const AGENT_EMAILS = ['helder.filho@grupoep.com.br'];

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // info ou chat
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = auth.currentUser;
  const isAgent = currentUser && AGENT_EMAILS.includes(currentUser.email || '');

  useEffect(() => {
    if (!ticketId) return;

    // Busca os dados do Ticket
    const ticketRef = doc(db, 'ep-resolve', ticketId);
    const unsubscribeTicket = onSnapshot(ticketRef, (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert("Chamado não encontrado!");
        navigate('/dashboard');
      }
      setLoading(false);
    });

    // Busca a comunicação (comentários)
    const commentsRef = collection(db, 'ep-resolve', ticketId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeTicket();
      unsubscribeComments();
    };
  }, [ticketId, navigate]);

  const handleAssignToMe = async () => {
    if (!ticketId || !currentUser) return;
    try {
      await updateDoc(doc(db, 'ep-resolve', ticketId), {
        status: 'In Progress',
        assignedToName: currentUser.displayName || 'Atendente',
        assignedToEmail: currentUser.email,
        assignedAt: serverTimestamp()
      });
      // Adiciona comentário automático de sistema
      await addDoc(collection(db, 'ep-resolve', ticketId, 'comments'), {
        text: `Chamado atribuído a ${currentUser.displayName || 'Atendente'}. Em atendimento.`,
        authorName: 'Sistema',
        authorEmail: 'system',
        isSystem: true,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao atribuir chamado.");
    }
  };

  const handleCloseTicket = async () => {
    if (!ticketId || !currentUser) return;
    try {
      await updateDoc(doc(db, 'ep-resolve', ticketId), {
        status: 'Closed',
        resolvedAt: serverTimestamp()
      });
      await addDoc(collection(db, 'ep-resolve', ticketId, 'comments'), {
        text: `Chamado encerrado por ${currentUser.displayName || 'Atendente'}.`,
        authorName: 'Sistema',
        authorEmail: 'system',
        isSystem: true,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao encerrar chamado.");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticketId || !currentUser) return;
    
    try {
      await addDoc(collection(db, 'ep-resolve', ticketId, 'comments'), {
        text: newComment,
        authorName: currentUser.displayName || 'Usuário',
        authorEmail: currentUser.email,
        isSystem: false,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let file = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        file = items[i].getAsFile();
        break;
      }
    }

    if (file && ticketId && currentUser) {
      setIsUploading(true);
      const storageRef = ref(storage, `tickets/${ticketId}/${Date.now()}_${file.name}`);
      try {
        const snapshot = await uploadBytesResumable(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        await addDoc(collection(db, 'ep-resolve', ticketId, 'comments'), {
          text: 'Enviou uma imagem',
          imageUrl: url,
          authorName: currentUser.displayName || 'Usuário',
          authorEmail: currentUser.email,
          isSystem: false,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error(error);
        alert('Erro ao fazer upload da imagem.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (loading || !ticket) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#0D6081]/20 border-t-[#0D6081] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header do Ticket */}
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-[#0D6081] flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0D6081]">
              Chamado <span className="text-gray-400 font-normal text-xl">#{ticket.id.substring(0, 6).toUpperCase()}</span>
            </h1>
            <p className="text-gray-800 font-medium text-lg mt-1">{ticket.title || ticket.description}</p>
          </div>
          <div className="flex items-center gap-3">
             <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-green-100 text-green-700 border-green-200'
             }`}>
               {ticket.status === 'Open' ? 'Aberto (Fila)' : ticket.status === 'In Progress' ? 'Em Atendimento' : 'Concluído'}
             </span>
             {isAgent && ticket.status === 'Open' && (
                <button onClick={handleAssignToMe} className="flex items-center gap-2 bg-[#0D6081] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#094a64] shadow-md transition-all">
                  <Hand className="w-4 h-4" /> Atender
                </button>
             )}
             {isAgent && ticket.status === 'In Progress' && ticket.assignedToEmail === currentUser?.email && (
                <button onClick={handleCloseTicket} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 shadow-md transition-all">
                  <CheckCircle className="w-4 h-4" /> Encerrar
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200/60 mb-6">
        <button 
          onClick={() => setActiveTab('info')}
          className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'info' ? 'border-b-2 border-[#0D6081] text-[#0D6081]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Info className="w-4 h-4" /> Informações Gerais
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'border-b-2 border-[#0D6081] text-[#0D6081]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare className="w-4 h-4" /> Comunicação
        </button>
      </div>

      {/* Content */}
      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/60 border border-white/80 p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#0D6081]"/> Solicitante</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500 block text-xs">Nome</span> <span className="font-semibold text-gray-800">{ticket.userName}</span></p>
                <p><span className="text-gray-500 block text-xs">E-mail</span> <span className="font-medium text-gray-800">{ticket.userEmail}</span></p>
                <p><span className="text-gray-500 block text-xs">Departamento</span> <span className="font-medium text-gray-800">{ticket.department}</span></p>
              </div>
            </div>
            {ticket.assignedToName && (
              <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl shadow-sm">
                <h3 className="font-bold text-blue-800 mb-2">Atendente Responsável</h3>
                <p className="font-semibold text-blue-900">{ticket.assignedToName}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/60 border border-white/80 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2 text-lg">Descrição do Problema</h3>
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-xs font-bold text-[#0D6081] bg-[#0D6081]/10 px-2 py-1 rounded-md">{ticket.system}</span>
                 <span className="text-xs text-gray-500">{ticket.createdAt?.toDate?.().toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-xl border border-gray-100">{ticket.description}</p>
              
              {ticket.attachmentUrl && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#0D6081]" /> Anexo do Chamado
                  </h4>
                  <div className="flex items-center gap-4">
                    {ticket.attachmentUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <div className="relative group cursor-pointer" onClick={() => window.open(ticket.attachmentUrl, '_blank')}>
                        <img src={ticket.attachmentUrl} alt="Anexo" className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm group-hover:opacity-80 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full font-bold">VER ORIGINAL</span>
                        </div>
                      </div>
                    ) : (
                      <a 
                        href={ticket.attachmentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group"
                      >
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">📄</div>
                        <span className="text-sm font-semibold text-[#0D6081]">ABRIR ANEXO</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[500px] bg-white/60 border border-white/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {comments.length === 0 && (
              <div className="text-center text-gray-400 py-10">Nenhuma comunicação ainda. Envie uma mensagem para iniciar.</div>
            )}
            {comments.map((comment) => (
              comment.isSystem ? (
                <div key={comment.id} className="text-center my-4">
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">{comment.text}</span>
                </div>
              ) : (
                <div key={comment.id} className={`flex flex-col max-w-[80%] ${comment.authorEmail === currentUser?.email ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <span className="text-xs text-gray-500 mb-1 px-1">{comment.authorName} • {comment.createdAt?.toDate?.().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  <div className={`p-4 rounded-2xl ${comment.authorEmail === currentUser?.email ? 'bg-[#0D6081] text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                    {comment.imageUrl ? (
                      <div>
                        <img src={comment.imageUrl} alt="Anexo" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(comment.imageUrl, '_blank')} />
                        <p className="text-xs mt-2 opacity-80 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {comment.text}</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
          {ticket.status !== 'Closed' && (
            <form onSubmit={handleSendComment} className="p-4 bg-white/80 border-t border-gray-200 flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onPaste={handlePaste}
                disabled={isUploading}
                placeholder={isUploading ? "Enviando imagem..." : "Escreva um comentário ou cole (Ctrl+V) uma imagem..."}
                className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D6081]/50 bg-white disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button type="submit" disabled={!newComment.trim() || isUploading} className="bg-[#0D6081] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#094a64] transition-colors disabled:opacity-50">
                Enviar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
