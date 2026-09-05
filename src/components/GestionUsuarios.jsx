import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUsuarios, useTerapeutas } from '../hooks/useSupabase';
import EditorDisponibilidad from './EditorDisponibilidad';
import { ShieldCheck, UserCog, Stethoscope, HelpCircle, Save, Trash2, CalendarClock } from 'lucide-react';

const ROLES_TODOS = [
    { value: 'sin_asignar', label: 'Sin asignar', icon: HelpCircle, color: 'text-gray-400' },
    { value: 'administrador', label: 'Administrador', icon: ShieldCheck, color: 'text-purple-500' },
    { value: 'recepcionista', label: 'Recepcionista', icon: UserCog, color: 'text-blue-500' },
    { value: 'especialista', label: 'Especialista', icon: Stethoscope, color: 'text-pink-500' },
];

// Recepcionista puede dar de alta especialistas, pero no otorgar roles de acceso administrativo.
const ROLES_RECEPCIONISTA = ROLES_TODOS.filter(r => r.value !== 'administrador' && r.value !== 'recepcionista');

const especialistaVacio = { especialidad: '', color: '#ffd1dc', telefono: '' };

const GestionUsuarios = ({ esAdmin }) => {
    const { usuarios, loading, refetch: refetchUsuarios } = useUsuarios();
    const { terapeutas, refetch: refetchTerapeutas } = useTerapeutas();
    const [ediciones, setEdiciones] = useState({});
    const [guardandoId, setGuardandoId] = useState(null);

    const ROLES = esAdmin ? ROLES_TODOS : ROLES_RECEPCIONISTA;

    const terapeutaDe = (u) => terapeutas.find(t => t.id === u.terapeuta_id) || null;

    const valorDe = (u, campo) => {
        if (ediciones[u.id]?.[campo] !== undefined) return ediciones[u.id][campo];
        if (campo === 'rol') return u.rol;
        const t = terapeutaDe(u);
        if (campo === 'especialidad') return t?.especialidad ?? '';
        if (campo === 'color') return t?.color_calendario ?? especialistaVacio.color;
        if (campo === 'telefono') return t?.telefono ?? '';
        return '';
    };

    const setCampo = (u, campo, valor) => {
        setEdiciones(prev => ({ ...prev, [u.id]: { ...prev[u.id], [campo]: valor } }));
    };

    const refetchTodo = () => { refetchUsuarios(); refetchTerapeutas(); };

    const guardar = async (u) => {
        const rol = valorDe(u, 'rol');
        setGuardandoId(u.id);

        if (rol === 'especialista') {
            const datosTerapeuta = {
                nombre: u.nombre_completo || u.email,
                especialidad: valorDe(u, 'especialidad'),
                color_calendario: valorDe(u, 'color'),
                telefono: valorDe(u, 'telefono')
            };

            if (u.terapeuta_id) {
                const { error } = await supabase.from('terapeutas').update(datosTerapeuta).eq('id', u.terapeuta_id);
                if (error) { alert(error.message); setGuardandoId(null); return; }
                const { error: errPerfil } = await supabase.from('perfiles').update({ rol }).eq('id', u.id);
                if (errPerfil) { alert(errPerfil.message); setGuardandoId(null); return; }
            } else {
                const { data: nuevoTerapeuta, error } = await supabase.from('terapeutas').insert([datosTerapeuta]).select().single();
                if (error) { alert(error.message); setGuardandoId(null); return; }
                const { error: errPerfil } = await supabase.from('perfiles').update({ rol, terapeuta_id: nuevoTerapeuta.id }).eq('id', u.id);
                if (errPerfil) { alert(errPerfil.message); setGuardandoId(null); return; }
            }
        } else {
            // Al salir de "especialista" se libera el vínculo, pero el recurso de calendario no se borra.
            const { error } = await supabase.from('perfiles').update({ rol, terapeuta_id: null }).eq('id', u.id);
            if (error) { alert(error.message); setGuardandoId(null); return; }
        }

        setGuardandoId(null);
        setEdiciones(prev => { const next = { ...prev }; delete next[u.id]; return next; });
        refetchTodo();
    };

    const eliminarEspecialista = async (u) => {
        if (!u.terapeuta_id) return;
        if (!confirm(`¿Eliminar por completo a ${u.nombre_completo} del calendario? También pierde el acceso de especialista.`)) return;
        setGuardandoId(u.id);
        await supabase.from('perfiles').update({ rol: 'sin_asignar', terapeuta_id: null }).eq('id', u.id);
        await supabase.from('terapeutas').delete().eq('id', u.terapeuta_id);
        setGuardandoId(null);
        refetchTodo();
    };

    if (loading) return <p className="text-center text-gray-400">Cargando usuarios...</p>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto p-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 rounded-2xl text-purple-500">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">Usuarios</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Vida Materna • Personas y acceso</p>
                </div>
            </div>

            <div className="grid gap-4">
                {usuarios.map((u) => {
                    const rolActual = valorDe(u, 'rol');
                    const RolIcon = ROLES_TODOS.find(r => r.value === rolActual)?.icon || HelpCircle;
                    const hayCambios = !!ediciones[u.id];

                    return (
                        <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                        <RolIcon size={20} className={ROLES_TODOS.find(r => r.value === rolActual)?.color} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-700 truncate">{u.nombre_completo || 'Sin nombre'}</h3>
                                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 md:w-auto w-full">
                                    <select
                                        className="p-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-100"
                                        value={rolActual}
                                        onChange={e => setCampo(u, 'rol', e.target.value)}
                                    >
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>

                                    <button
                                        onClick={() => guardar(u)}
                                        disabled={!hayCambios || guardandoId === u.id}
                                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-95"
                                    >
                                        <Save size={16} /> {guardandoId === u.id ? 'Guardando...' : 'Guardar'}
                                    </button>

                                    {rolActual === 'especialista' && u.terapeuta_id && (
                                        <button
                                            onClick={() => eliminarEspecialista(u)}
                                            className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                                            title="Eliminar del calendario y quitar acceso"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {rolActual === 'especialista' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Especialidad</label>
                                        <input type="text" placeholder="Ej: Pediatría"
                                            className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-100"
                                            value={valorDe(u, 'especialidad')} onChange={e => setCampo(u, 'especialidad', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Teléfono WhatsApp</label>
                                        <input type="tel" placeholder="Ej: 521..."
                                            className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-100"
                                            value={valorDe(u, 'telefono')} onChange={e => setCampo(u, 'telefono', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Color en agenda</label>
                                        <input type="color" className="w-full h-[42px] bg-gray-50 p-1 rounded-xl cursor-pointer border-none"
                                            value={valorDe(u, 'color')} onChange={e => setCampo(u, 'color', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {rolActual === 'especialista' && (
                                u.terapeuta_id ? (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                            <CalendarClock size={14} /> Horario semanal disponible
                                        </p>
                                        <EditorDisponibilidad terapeutaId={u.terapeuta_id} />
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-gray-300 italic mt-4 pt-4 border-t border-gray-100">
                                        Guarda primero para poder configurar su horario semanal.
                                    </p>
                                )
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GestionUsuarios;
