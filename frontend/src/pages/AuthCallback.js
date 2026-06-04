import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = hash?.split('session_id=')[1];
    if (!sessionId) { navigate('/login'); return; }

    (async () => {
      try {
        const { data } = await api.post('/auth/google-session', { session_id: sessionId });
        setUser(data.user);
        if (data.access_token) localStorage.setItem('access_token', data.access_token);
        navigate('/', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-body">Completing sign in...</p>
      </div>
    </div>
  );
}
