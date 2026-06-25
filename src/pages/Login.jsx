import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function TreeLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="7" r="4" fill="#6C63FF"/>
      <line x1="20" y1="11" x2="20" y2="17" stroke="#6C63FF" strokeWidth="1.5"/>
      <circle cx="10" cy="21" r="3.5" fill="#6C63FF" fillOpacity="0.75"/>
      <circle cx="30" cy="21" r="3.5" fill="#6C63FF" fillOpacity="0.75"/>
      <line x1="20" y1="17" x2="10" y2="21" stroke="#6C63FF" strokeWidth="1.5" strokeOpacity="0.6"/>
      <line x1="20" y1="17" x2="30" y2="21" stroke="#6C63FF" strokeWidth="1.5" strokeOpacity="0.6"/>
      <circle cx="4" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
      <circle cx="16" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
      <circle cx="24" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
      <circle cx="36" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
      <line x1="10" y1="24.5" x2="4" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
      <line x1="10" y1="24.5" x2="16" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
      <line x1="30" y1="24.5" x2="24" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
      <line x1="30" y1="24.5" x2="36" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
    </svg>
  );
}

function BackgroundTree() {
  const nodes = [
    { cx: 500, cy: 80, r: 22 },
    { cx: 260, cy: 220, r: 18 },
    { cx: 740, cy: 220, r: 18 },
    { cx: 120, cy: 370, r: 15 },
    { cx: 400, cy: 370, r: 15 },
    { cx: 600, cy: 370, r: 15 },
    { cx: 880, cy: 370, r: 15 },
    { cx: 50, cy: 500, r: 12 },
    { cx: 190, cy: 500, r: 12 },
    { cx: 330, cy: 500, r: 12 },
    { cx: 470, cy: 500, r: 12 },
    { cx: 540, cy: 500, r: 12 },
    { cx: 660, cy: 500, r: 12 },
    { cx: 820, cy: 500, r: 12 },
    { cx: 950, cy: 500, r: 12 },
    { cx: 20, cy: 610, r: 9 },
    { cx: 80, cy: 610, r: 9 },
    { cx: 155, cy: 610, r: 9 },
    { cx: 225, cy: 610, r: 9 },
    { cx: 300, cy: 610, r: 9 },
    { cx: 360, cy: 610, r: 9 },
    { cx: 440, cy: 610, r: 9 },
    { cx: 510, cy: 610, r: 9 },
    { cx: 570, cy: 610, r: 9 },
    { cx: 640, cy: 610, r: 9 },
    { cx: 710, cy: 610, r: 9 },
    { cx: 790, cy: 610, r: 9 },
    { cx: 860, cy: 610, r: 9 },
    { cx: 930, cy: 610, r: 9 },
    { cx: 980, cy: 610, r: 9 },
  ];

  const edges = [
    [0,1],[0,2],
    [1,3],[1,4],[2,5],[2,6],
    [3,7],[3,8],[4,9],[4,10],[5,11],[5,12],[6,13],[6,14],
    [7,15],[7,16],[8,17],[8,18],[9,19],[9,20],[10,21],[10,22],[11,23],[11,24],[12,25],[12,26],[13,27],[13,28],[14,29],
  ];

  return (
    <svg
      viewBox="0 0 1000 680"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.12,
        pointerEvents: 'none',
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="#6C63FF"
          strokeWidth="1.5"
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={n.r} fill="#6C63FF" />
      ))}
    </svg>
  );
}

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
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setDiscordLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0F',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BackgroundTree />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(10,10,15,0.35) 0%, rgba(10,10,15,0.82) 55%, #0A0A0F 80%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '360px',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-block', marginBottom: '14px' }}>
            <TreeLogo size={48} />
          </div>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            SkillTree
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
            Connecte-toi pour accéder à tes arbres
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '18px',
            padding: '11px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: '7px',
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              style={{
                width: '100%',
                padding: '11px 13px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: '7px',
            }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '11px 13px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>
          <button
            type="submit"
            disabled={loading || discordLoading}
            style={{
              marginTop: '4px',
              padding: '12px',
              background: '#6C63FF',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || discordLoading ? 'not-allowed' : 'pointer',
              opacity: loading || discordLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? (
              <>
                <span style={{ width:'13px', height:'13px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                Connexion…
              </>
            ) : 'Se connecter'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', fontWeight:600, letterSpacing:'0.05em' }}>OU</span>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
        </div>

        <button
          onClick={signInWithDiscord}
          type="button"
          disabled={loading || discordLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#5865F2',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading || discordLoading ? 'not-allowed' : 'pointer',
            opacity: loading || discordLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'opacity 0.15s',
          }}
        >
          {discordLoading ? (
            <>
              <span style={{ width:'13px', height:'13px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
              Redirection…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="white">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Continuer avec Discord
            </>
          )}
        </button>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: rgba(255,255,255,0.18); }
        `}</style>
      </div>
    </div>
  );
}