import React, { useState, useEffect } from 'react';
import { Mail, MailOpen, Send, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import type { CustomerMessage } from '../../types';

export const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<CustomerMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const list = await apiService.getMessages();
    setMessages(list);
    if (list.length > 0 && !selectedMsg) {
      setSelectedMsg(list[0]);
    }
    setLoading(false);
  };

  const handleToggleRead = async (id: string) => {
    await apiService.toggleMessageRead(id);
    loadMessages();
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setReplyContent('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-serif font-bold text-2xl text-slate-900">Support & Wholesale Customer Inbox</h2>
        <p className="text-xs text-slate-500">Read and respond to customer inquiries, custom wedding orders, and sizing support.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Inbox Sidebar List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-serif font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Conversations ({messages.length})</span>
            <span className="text-xs text-blue-600 font-semibold">{messages.filter(m => !m.read).length} Unread</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No messages in inbox.</div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  if (!msg.read) handleToggleRead(msg.id);
                }}
                className={`p-4 cursor-pointer transition-colors space-y-1 ${
                  selectedMsg?.id === msg.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${!msg.read ? 'text-slate-900 font-serif' : 'text-slate-700'}`}>{msg.name}</span>
                  <span className="text-[10px] text-slate-400">{msg.date}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{msg.subject}</div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Content & Inline Reply Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm min-h-[450px] flex flex-col justify-between">
          {selectedMsg ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-200 space-y-1">
                  <span className="text-xs text-blue-600 font-semibold">{selectedMsg.email}</span>
                  <h3 className="font-serif font-bold text-xl text-slate-900">{selectedMsg.subject}</h3>
                  <div className="text-xs text-slate-400">Received on {selectedMsg.date}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedMsg.message}
                </div>
              </div>

              {/* Reply Form */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-serif font-bold text-sm text-slate-900">Official Brand Response</h4>

                {sentSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Response dispatched successfully to {selectedMsg.email}.
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    rows={4}
                    required
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={`Write response to ${selectedMsg.name}...`}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />

                  <div className="flex justify-end">
                    <button type="submit" className="btn-copper text-xs py-2.5 px-6 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Send Response
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select a message to read.</div>
          )}
        </div>

      </div>

    </div>
  );
};
