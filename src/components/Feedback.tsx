import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function Feedback() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'ep-resolve', ticketId), {
        feedbackRating: rating,
        feedbackComment: comment,
        feedbackAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg border-4 border-white">✓</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Obrigado pelo seu feedback!</h2>
        <p className="text-gray-600 mb-8 text-lg">Sua avaliação nos ajuda a melhorar cada vez mais nosso atendimento.</p>
        <p className="text-sm text-gray-400">Redirecionando para o painel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D6081]">Avaliar Atendimento</h1>
        <p className="text-gray-600 mt-2">Referente ao chamado: <span className="font-bold text-gray-800 bg-white/60 px-2 py-1 rounded">{ticketId}</span></p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white/40 p-8 rounded-2xl border border-white/80 shadow-sm">
         <div className="flex flex-col items-center">
            <label className="text-lg font-semibold text-gray-800 mb-4">Como você avalia a resolução deste problema?</label>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={`w-12 h-12 ${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-[#0D6081]">
              {rating === 1 && '1 - Muito Ruim'}
              {rating === 2 && '2 - Ruim'}
              {rating === 3 && '3 - Regular'}
              {rating === 4 && '4 - Bom'}
              {rating === 5 && '5 - Excelente!'}
            </p>
         </div>
         
         <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Comentários (Opcional)</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 rounded-xl border border-white/80 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#0D6081]/50 outline-none transition-all resize-y placeholder:text-gray-400" 
              rows={4} 
              placeholder="Conte-nos como foi a experiência. O que foi bom? O que pode melhorar?" 
            />
         </div>
         
         <div className="flex gap-4 pt-4 border-t border-white/50">
           <button 
             type="button" 
             onClick={() => navigate('/dashboard')} 
             className="w-1/3 p-4 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
           >
             Cancelar
           </button>
           <button 
             type="submit" 
             disabled={isSubmitting}
             className="w-2/3 p-4 rounded-xl bg-gradient-to-r from-[#0D6081] to-[#084259] text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center"
           >
             {isSubmitting ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               'Enviar Avaliação'
             )}
           </button>
         </div>
      </form>
    </div>
  );
}
