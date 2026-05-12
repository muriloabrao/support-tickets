import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function Dashboard() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Lista de atendentes autorizados
  const AGENT_EMAILS = ['helder.filho@grupoep.com.br'];
  const isAgent = auth.currentUser ? AGENT_EMAILS.includes(auth.currentUser.email || '') : false;

  React.useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    // Se for atendente, vê toda a fila. Se for usuário, vê só os seus chamados.
    const q = isAgent 
      ? query(collection(db, 'ep-resolve'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'ep-resolve'), where('userEmail', '==', userEmail), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D6081]">Meus Chamados</h1>
        <p className="text-gray-600 mt-2">Acompanhe o status das suas solicitações de suporte.</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#0D6081]/20 border-t-[#0D6081] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-5 bg-white/60 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/80 transition-colors shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#0D6081] bg-[#0D6081]/10 px-2 py-0.5 rounded-md">{ticket.system}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/> {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora mesmo'}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 text-lg">{ticket.title || ticket.description?.substring(0, 40) + '...'}</p>
                {isAgent && <p className="text-xs text-gray-500 mt-1">Solicitante: {ticket.userName}</p>}
              </div>
              
              <div className="flex items-center gap-3 md:justify-end">
                {ticket.status === 'Open' ? (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1.5 border border-yellow-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Na Fila
                  </span>
                ) : ticket.status === 'In Progress' ? (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1.5 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" /> Em Atendimento
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1.5 border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
                  </span>
                )}

                <Link 
                  to={`/ticket/${ticket.id}`} 
                  className="text-sm font-semibold bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-50 hover:text-[#0D6081] transition-all whitespace-nowrap"
                >
                  Abrir Detalhes
                </Link>
              </div>
            </div>
          ))}
          
          {tickets.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
              <p className="text-gray-500 font-medium">Você ainda não possui chamados abertos.</p>
              <Link to="/novo-chamado" className="text-[#0D6081] hover:underline mt-2 inline-block font-semibold">Abrir um chamado agora</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
