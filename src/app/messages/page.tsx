'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Building2, 
  User, 
  DollarSign, 
  Briefcase,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCheck
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatUsd } from '@/lib/utils';

export default function MessagesPage() {
  const { conversations, activeRole, currentCandidate, sendMessage } = useAppStore();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const senderName = activeRole === 'candidate' 
      ? `${currentCandidate?.firstName || 'Candidato'} ${currentCandidate?.lastName || ''}`
      : 'Elena Rostova (Recruiter)';

    sendMessage(activeConv.id, inputMessage.trim(), activeRole, senderName);
    setInputMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Info */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <span>Mensajería Directa & Canales Verificados</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Conversaciones vinculadas a tus postulaciones y ofertas inbound aceptadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-pastel-emerald flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Canales 100% Anti-Spam</span>
          </span>
        </div>
      </div>

      {/* Container Box */}
      <div className="card-clean rounded-3xl overflow-hidden shadow-sm h-[680px] flex flex-col md:flex-row border border-slate-200">
        
        {/* Left Sidebar: Conversations list */}
        <div className="md:w-80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversaciones</h2>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {conversations.length} activas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center p-8 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500">No tienes conversaciones activas aún.</p>
                <Link
                  href="/jobs"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 block"
                >
                  Explorar vacantes y postular
                </Link>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = conv.id === activeConv?.id;
                const otherPartyName = activeRole === 'candidate' ? conv.companyName : conv.candidateName;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border ${
                      isSelected 
                        ? 'bg-white border-indigo-200 shadow-sm' 
                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-xs truncate max-w-[150px] ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {otherPartyName}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                        ${conv.salaryUsd} USD
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium truncate mb-1">
                      {conv.jobTitle}
                    </p>

                    {lastMsg && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {lastMsg.content}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Chat Top Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {activeRole === 'candidate' ? (
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <User className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeRole === 'candidate' ? activeConv.companyName : activeConv.candidateName}
                    </h3>
                    <span className="badge-pastel-emerald text-[10px] font-bold px-2 py-0.2 rounded-full">
                      Canal Verificado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Posición: <strong className="text-slate-700">{activeConv.jobTitle}</strong> · Rango: <strong className="text-emerald-600">${activeConv.salaryUsd} USD</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
              {/* Context Pill */}
              <div className="text-center my-2">
                <span className="text-[11px] bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Canal directo abierto para la vacante &quot;{activeConv.jobTitle}&quot;</span>
                </span>
              </div>

              {activeConv.messages.map(msg => {
                const isMe = msg.senderRole === activeRole;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-1 px-1">
                      {msg.senderName}
                    </span>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder="Escribe tu mensaje o respuesta técnica..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            Selecciona una conversación para ver los mensajes.
          </div>
        )}

      </div>

    </div>
  );
}
