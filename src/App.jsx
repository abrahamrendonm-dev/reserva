import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth'; // El nuevo componente
import CalendarioPrincipal from './components/CalendarioPrincipal';
import GestionTerapeutas from './components/GestionTerapeutas';
import GestionSalas from './components/GestionSalas';
import { Heart, LogOut } from 'lucide-react';

function App() {
  const [tab, setTab] = useState('agenda');
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Escuchar cambios en la autenticación
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si no hay sesión, devolvemos el componente de Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen p-4 md:p-10">
      <header className="text-center mb-12 relative">
        {/* Botón de Cerrar Sesión */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="absolute right-0 top-0 flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
        >
          <LogOut size={18} /> Salir
        </button>

        <div className="flex justify-center items-center gap-2 mb-2">
          <Heart className="text-pink-400" fill="#f472b6" />
          <h1 className="text-3xl font-light tracking-tighter text-gray-600 uppercase">
            Vida <span className="font-bold text-pink-400">Materna</span>
          </h1>
        </div>

        <nav className="inline-flex bg-white p-2 rounded-3xl shadow-sm border border-pink-50 mt-6">
          <button onClick={() => setTab('agenda')} className={`px-6 py-2 rounded-2xl transition ${tab === 'agenda' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Agenda</button>
          <button onClick={() => setTab('equipo')} className={`px-6 py-2 rounded-2xl transition ${tab === 'equipo' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Equipo</button>
          <button onClick={() => setTab('salas')} className={`px-6 py-2 rounded-2xl transition ${tab === 'salas' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Salas</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        {tab === 'agenda' && <CalendarioPrincipal />}
        {tab === 'equipo' && <GestionTerapeutas />}
        {tab === 'salas' && <GestionSalas />}
      </main>
    </div>
  );
}

export default App;