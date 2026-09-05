import React from 'react';
import { supabase } from '../supabaseClient';
import { Clock3, LogOut } from 'lucide-react';

const PendienteActivacion = ({ email }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-4 font-['Quicksand']">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center space-y-6 border border-white">
                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-pink-400">
                    <Clock3 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-700">Cuenta pendiente de activación</h2>
                <p className="text-gray-500 leading-relaxed">
                    Tu cuenta{email ? <> (<span className="font-bold text-gray-700">{email}</span>)</> : ''} ya está registrada,
                    pero un administrador todavía no te asigna un rol (Administrador, Recepcionista o Especialista).
                    Pídele que te active desde la pantalla "Usuarios".
                </p>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 p-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                    <LogOut size={18} /> Cerrar sesión
                </button>
            </div>
        </div>
    );
};

export default PendienteActivacion;
