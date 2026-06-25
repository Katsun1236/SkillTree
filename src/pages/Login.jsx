import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8">
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="p-2 border" />
      <input type="password" placeholder="Mot de passe" onChange={(e) => setPassword(e.target.value)} className="p-2 border" />
      <button disabled={loading} className="bg-black text-white p-3">
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}