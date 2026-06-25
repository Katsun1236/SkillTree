import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn } from 'lucide-react';

export default function Login({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setView('index');
    }
  };

  const signInWithDiscord = async () => {
    setDiscordLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setDiscordLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-3xl">S</div>
        </div>
        <h1 className="text-3xl font-black text-center mb-8">SkillTree</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              placeholder="Ton adresse email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || discordLoading}
            className="w-full bg-black text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn size={20} />
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold">OU</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          onClick={signInWithDiscord}
          type="button"
          disabled={loading || discordLoading}
          className="w-full bg-[#5865F2] text-white p-3 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-[#4752C4] transition shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          {discordLoading ? 'Redirection...' : 'Continuer avec Discord'}
        </button>
      </div>
    </div>
  );
}