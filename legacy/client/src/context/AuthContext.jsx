import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { api } from '../api';

const AuthCtx = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api('/api/users/me');
        setUser(me);
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('platformToken');
      }
      setLoading(false);
    }
    hydrate();
  }, []);

  useEffect(() => {
    if (!user?._id) {
      socket?.disconnect();
      setSocket(null);
      return;
    }
    const s = io(SOCKET_URL || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => {
      const rooms = [`user:${user._id}`];
      if (user.college) rooms.push(`college:${user.college}`);
      if (user.role === 'platform_admin') rooms.push('platform');
      s.emit('auth', { rooms });
    });
    s.on('complaint:new', (payload) =>
      toast.info(`New complaint: ${payload.title || payload.id || 'check dashboard'}`)
    );
    s.on('complaint:updated', () => toast.success('Complaint status updated'));
    s.on('complaint:reply', () => toast.info('Staff replied to a complaint'));
    s.on('complaint:escalated', () => toast.warn('Complaint escalated'));

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user?._id, user?.college, user?.role]);

  const loginPayload = async (payload) => {
    if (payload.platformToken)
      sessionStorage.setItem('platformToken', payload.platformToken);
    if (payload.token) sessionStorage.setItem('token', payload.token);
    const me = await api('/api/users/me');
    setUser(me);
    return me;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('platformToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, loginPayload, logout, setUser, socket }),
    [user, loading, socket]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('Auth missing');
  return v;
}
