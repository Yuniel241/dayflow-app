import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Leaf } from 'lucide-react';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      api.get('/auth/me').then((res) => {
        setUser(res.data.user);
        navigate('/dashboard', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>
          <Leaf size={40} color="#16a34a" />
        </div>
        <p style={{ marginTop: 16, color: '#166534', fontSize: 14, fontWeight: 600 }}>
          Vérification en cours...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
