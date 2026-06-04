import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load or create chat ID
    const stored = localStorage.getItem('nenath_chat_id');
    if (stored) { setChatId(stored); setNameSet(true); }
    if (user) { setNameSet(true); setGuestName(user.name); }
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      try {
        const { data } = await api.get(`/chat/messages/${chatId}`);
        setMessages(data.messages);
      } catch {}
    };

    if (chatId && open) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
      return () => clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [chatId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = () => {
    if (!guestName.trim() && !user) return;
    const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setChatId(id);
    localStorage.setItem('nenath_chat_id', id);
    setNameSet(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const payload = {
        chat_id: chatId,
        message: input,
        guest_id: user?.user_id || `guest_${chatId}`,
        guest_name: user?.name || guestName
      };
      const { data } = await api.post('/chat/messages', payload);
      setMessages(prev => [...prev, data.message]);
      setInput('');
    } catch {}
    finally { setSending(false); }
  };

  return (
    <>
      {/* Chat Toggle Button - positioned above WhatsApp */}
      {!open && (
        <button
          data-testid="chat-widget-toggle"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 bg-[#1E3A8A] text-white p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div data-testid="chat-widget" className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-[#0A0A0A] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-sm font-semibold">NENATH Support</p>
              <p className="text-[10px] text-gray-400">We typically reply within minutes</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded"><X size={16} /></button>
          </div>

          {/* Name input if not set */}
          {!nameSet ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <MessageCircle size={32} className="text-[#C6A85B]" />
              <p className="text-sm text-gray-600 text-center font-body">Welcome! Please enter your name to start chatting.</p>
              <Input
                data-testid="chat-guest-name"
                value={guestName} onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name" className="h-10 border-gray-200"
                onKeyDown={(e) => e.key === 'Enter' && startChat()}
              />
              <Button data-testid="chat-start-btn" onClick={startChat} disabled={!guestName.trim()}
                className="w-full bg-[#0A0A0A] text-white text-xs uppercase tracking-wider">
                Start Chat
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">Send a message to start the conversation</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 text-sm ${
                      msg.sender_type === 'customer'
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      {msg.sender_type === 'admin' && <p className="text-[10px] text-[#C6A85B] font-semibold mb-1">Support</p>}
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[9px] mt-1 ${msg.sender_type === 'customer' ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0 bg-white">
                <Input
                  data-testid="chat-message-input"
                  value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="h-9 text-sm border-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button data-testid="chat-send-btn" onClick={sendMessage} disabled={sending || !input.trim()} size="sm"
                  className="bg-[#0A0A0A] text-white h-9 px-3">
                  <Send size={14} />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
