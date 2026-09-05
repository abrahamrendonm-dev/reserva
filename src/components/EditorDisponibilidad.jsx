import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useDisponibilidad } from '../hooks/useSupabase';
import { Plus, X, Clock } from 'lucide-react';

const DIAS = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
];

const EditorDisponibilidad = ({ terapeutaId }) => {
    const { disponibilidad, loading, refetch } = useDisponibilidad(terapeutaId);
    const [nuevoRango, setNuevoRango] = useState({});

    const setCampoNuevo = (dia, campo, valor) => {
        setNuevoRango(prev => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }));
    };

    const agregarRango = async (dia) => {
        const { inicio, fin } = nuevoRango[dia] || {};
        if (!inicio || !fin) return;
        if (inicio >= fin) { alert('La hora de fin debe ser posterior a la de inicio.'); return; }

        const { error } = await supabase.from('disponibilidad_semanal').insert([{
            terapeuta_id: terapeutaId, dia_semana: dia, hora_inicio: inicio, hora_fin: fin
        }]);
        if (error) { alert(error.message); return; }

        setNuevoRango(prev => ({ ...prev, [dia]: { inicio: '', fin: '' } }));
        refetch();
    };

    const eliminarRango = async (id) => {
        const { error } = await supabase.from('disponibilidad_semanal').delete().eq('id', id);
        if (error) { alert(error.message); return; }
        refetch();
    };

    if (loading) return <p className="text-xs text-gray-400">Cargando horario...</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIAS.map(dia => {
                const rangos = disponibilidad.filter(d => d.dia_semana === dia.value);
                const nuevo = nuevoRango[dia.value] || { inicio: '', fin: '' };

                return (
                    <div key={dia.value} className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{dia.label}</p>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {rangos.length === 0 && (
                                <span className="text-[11px] text-gray-300 italic">Sin horario disponible</span>
                            )}
                            {rangos.map(r => (
                                <span key={r.id} className="flex items-center gap-1.5 bg-pink-50 text-pink-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                    <Clock size={12} /> {r.hora_inicio.slice(0, 5)}–{r.hora_fin.slice(0, 5)}
                                    <button onClick={() => eliminarRango(r.id)} className="hover:text-red-500">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="time" value={nuevo.inicio} onChange={e => setCampoNuevo(dia.value, 'inicio', e.target.value)}
                                className="flex-1 p-2 bg-white rounded-lg text-xs outline-none border border-gray-100" />
                            <span className="text-gray-300 text-xs">–</span>
                            <input type="time" value={nuevo.fin} onChange={e => setCampoNuevo(dia.value, 'fin', e.target.value)}
                                className="flex-1 p-2 bg-white rounded-lg text-xs outline-none border border-gray-100" />
                            <button onClick={() => agregarRango(dia.value)} className="p-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors shrink-0">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EditorDisponibilidad;
