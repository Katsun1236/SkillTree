import React from 'react';
import { LogIn } from 'lucide-react';
import Button from '../components/ui/Butoon';

export default function Login({ setView }) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center font-black text-3xl">S</div>
        </div>
        <h1 className="text-3xl font-black text-center mb-8">SkillTree</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Identifiant</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition" 
              placeholder="Ton pseudo" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">Mot de passe</label>
            <input 
              type="password" 
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition" 
              placeholder="••••••••" 
            />
          </div>
          
          <div className="pt-4">
            <Button fullWidth icon={LogIn} onClick={() => setView('index')}>
              Se connecter
            </Button>
          </div>
        </div>
        
      </div>
    </div>
  );
}