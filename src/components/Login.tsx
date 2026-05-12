import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Garante que a sessão seja persistida localmente no navegador
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Monitor de Auth:", user?.email || "Nenhum usuário logado");
      if (user) {
        if (user.email?.endsWith('@grupoep.com.br')) {
          navigate('/dashboard');
        } else {
          auth.signOut();
          setError('Acesso restrito apenas para e-mails @grupoep.com.br');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    console.log("Tentando login com Janela Pop-up...");
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sucesso no Pop-up:", result.user.email);
    } catch (e: any) {
      console.error("Erro no login:", e);
      
      // O erro 'auth/cancelled-popup-request' ou de COOP às vezes acontece 
      // mas o login pode ter funcionado no background.
      if (e.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes de completar.');
      } else if (e.message.includes('Cross-Origin-Opener-Policy')) {
        // Se der erro de COOP, pedimos para tentar de novo ou aguardar o onAuthStateChanged
        console.warn("Aviso de COOP detectado, verificando sessão...");
      } else {
        setError('Erro ao entrar: ' + (e.message || 'Verifique sua conexão'));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel p-10 max-w-md w-full text-center relative z-10">
        <h1 className="text-4xl font-bold text-[#0D6081] mb-2 tracking-tight">🎫 EP Resolve</h1>
        <p className="text-gray-600 mb-10 text-lg">Central Unificada de Suporte</p>
        
        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium animate-in fade-in">
            {error}
            <p className="text-xs mt-2 opacity-70">Dica: Verifique se os cookies de terceiros estão liberados para o localhost.</p>
          </div>
        )}
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full p-4 rounded-xl bg-white/80 border border-gray-200 hover:bg-white flex items-center justify-center gap-3 font-semibold text-gray-700 hover:text-gray-900 transition-all shadow-sm hover:shadow focus:ring-4 focus:ring-[#0D6081]/20 disabled:opacity-70"
        >
          {isLoading ? (
             <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          )}
          <span>Entrar com Google (Grupo EP)</span>
        </button>
      </div>
      
      {/* Decoração de fundo */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#0D6081]/10 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
    </div>
  );
}
