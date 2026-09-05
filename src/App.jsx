import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { usePerfil } from './hooks/useSupabase';
import Auth from './components/Auth'; // El nuevo componente
import PendienteActivacion from './components/PendienteActivacion';
import CalendarioPrincipal from './components/CalendarioPrincipal';
import GestionUsuarios from './components/GestionUsuarios';
import GestionSalas from './components/GestionSalas';
import MiHorario from './components/MiHorario';
import { Heart, LogOut } from 'lucide-react';

function App() {
  const [tab, setTab] = useState('agenda');
  const [session, setSession] = useState(null);
  const { perfil, loading: perfilLoading } = usePerfil(session);

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

  if (perfilLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  // Sin rol asignado todavía: bloquear acceso al resto de la app
  if (!perfil || perfil.rol === 'sin_asignar') {
    return <PendienteActivacion email={session.user.email} />;
  }

  const esAdmin = perfil.rol === 'administrador';
  const puedeAdministrar = esAdmin || perfil.rol === 'recepcionista';
  const esEspecialista = perfil.rol === 'especialista';

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
          {puedeAdministrar && (
            <button onClick={() => setTab('usuarios')} className={`px-6 py-2 rounded-2xl transition ${tab === 'usuarios' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Usuarios</button>
          )}
          {puedeAdministrar && (
            <button onClick={() => setTab('salas')} className={`px-6 py-2 rounded-2xl transition ${tab === 'salas' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Salas</button>
          )}
          {esEspecialista && (
            <button onClick={() => setTab('horario')} className={`px-6 py-2 rounded-2xl transition ${tab === 'horario' ? 'bg-pink-400 text-white' : 'text-gray-400'}`}>Mi Horario</button>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        {tab === 'agenda' && <CalendarioPrincipal />}
        {tab === 'usuarios' && puedeAdministrar && <GestionUsuarios esAdmin={esAdmin} />}
        {tab === 'salas' && puedeAdministrar && <GestionSalas />}
        {tab === 'horario' && esEspecialista && <MiHorario perfil={perfil} />}
      </main>
    </div>
  );
}

export default App;