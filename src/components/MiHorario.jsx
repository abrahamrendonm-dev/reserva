import React from 'react';
import EditorDisponibilidad from './EditorDisponibilidad';
import { CalendarClock } from 'lucide-react';

const MiHorario = ({ perfil }) => {
    if (!perfil?.terapeuta_id) {
        return (
            <p className="text-center text-gray-400 max-w-md mx-auto">
                Tu cuenta todavía no está vinculada a una ficha de especialista.
                Pídele a un administrador o recepcionista que la complete desde "Usuarios".
            </p>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto p-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-100 rounded-2xl text-pink-500">
                    <CalendarClock size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">Mi Horario</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Vida Materna • Disponibilidad semanal</p>
                </div>
            </div>
            <p className="text-sm text-gray-400 mb-8">
                Define los bloques de horario en los que estás disponible cada semana. Fuera de estos horarios, nadie podrá agendarte citas.
            </p>

            <EditorDisponibilidad terapeutaId={perfil.terapeuta_id} />
        </div>
    );
};

export default MiHorario;
