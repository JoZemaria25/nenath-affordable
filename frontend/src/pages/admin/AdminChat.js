import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminChat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      pollRef.current = setInterval(() => fetchMessages(selectedChat), 4000);
      return () => clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/admin/chats');
      setChats(data.chats);
    } catch {}
  };

  const fetchMessages = async (chatId) => {
    try {
      const { data } = await api.get(`/chat/messages/${chatId}`);
      setMessages(data.messages);
    } catch {}
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      const { data } = await api.post('/admin/chat/reply', { chat_id: selectedChat, message: reply });
      setMessages(prev => [...prev, data.message]);
      setReply('');
      fetchChats();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div data-testid="admin-chat" className="flex h-[calc(100vh-140px)] min-h-[500px] bg-white border border-gray-200 overflow-hidden">
      {/* Chat List */}
      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-heading text-lg">Support Chats</h3>
          <p className="text-xs text-gray-500">{chats.length} conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No chats yet</p>
            </div>
          ) : (
            chats.map(chat => (
              <button key={chat.chat_id} onClick={() => setSelectedChat(chat.chat_id)}
                data-testid={`chat-item-${chat.chat_id}`}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedChat === chat.chat_id ? 'bg-[#F5F1EB]' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{chat.sender_name || 'Guest'}</p>
                  {chat.unread > 0 && (
                    <span className="bg-[#1E3A8A] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{chat.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">{chat.last_message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(chat.created_at).toLocaleString()}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden sm:flex'}`}>
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)} className="sm:hidden p-1"><ChevronLeft size={18} /></button>
              <div>
                <p className="text-sm font-semibold">Chat #{selectedChat.slice(0, 12)}</p>
                <p className="text-[10px] text-gray-400">Customer support conversation</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-3 py-2 text-sm ${
                    msg.sender_type === 'admin'
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-[10px] font-semibold mb-1 opacity-70">
                      {msg.sender_type === 'admin' ? 'You' : msg.sender_name}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-[9px] opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2 bg-white">
              <Input data-testid="admin-chat-reply" value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..." className="h-10 border-gray-200"
                onKeyDown={(e) => e.key === 'Enter' && sendReply()} />
              <Button data-testid="admin-chat-send" onClick={sendReply} disabled={sending || !reply.trim()}
                className="bg-[#1E3A8A] text-white h-10 px-4"><Send size={14} /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle size={40} className="mx-auto mb-2" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
