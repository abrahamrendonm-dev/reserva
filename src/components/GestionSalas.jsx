import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DoorOpen, Trash2, Edit2, X, Save, Sparkles } from 'lucide-react';

const GestionSalas = () => {
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);

    const [form, setForm] = useState({ nombre: '', color: '#e0f2fe' });

    const fetchSalas = async () => {
        const { data } = await supabase.from('salas').select('*').order('nombre');
        setSalas(data || []);
    };

    useEffect(() => { fetchSalas(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = { nombre: form.nombre, color_sala: form.color };

        if (editId) {
            const { error } = await supabase.from('salas').update(payload).eq('id', editId);
            if (error) alert(error.message);
            setEditId(null);
        } else {
            const { error } = await supabase.from('salas').insert([payload]);
            if (error) alert(error.message);
        }

        setForm({ nombre: '', color: '#e0f2fe' });
        fetchSalas();
        setLoading(false);
    };

    const iniciarEdicion = (s) => {
        setEditId(s.id);
        setForm({ nombre: s.nombre, color: s.color_sala || '#e0f2fe' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicion = () => {
        setEditId(null);
        setForm({ nombre: '', color: '#e0f2fe' });
    };

    const eliminarSala = async (s) => {
        if (confirm(`¿Eliminar la sala "${s.nombre}"?`)) {
            const { error } = await supabase.from('salas').delete().eq('id', s.id);
            if (error) alert(error.message);
            fetchSalas();
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto p-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-500">
                        {editId ? <Edit2 size={24} /> : <DoorOpen size={24} />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700">{editId ? 'Editar Sala' : 'Nueva Sala'}</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Vida Materna • Salas</p>
                    </div>
                </div>
                {editId && (
                    <button onClick={cancelarEdicion} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase transition-colors">
                        <X size={16} /> Cancelar edición
                    </button>
                )}
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Nombre</label>
                    <input
                        type="text" required placeholder="Ej: Consultorio 1"
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                        value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Color</label>
                        <input
                            type="color" className="w-full h-[52px] bg-gray-50 p-1 rounded-2xl cursor-pointer border-none"
                            value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className={`h-[52px] px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editId ? 'bg-blue-500 shadow-blue-100' : 'bg-blue-400 shadow-blue-100'}`}
                    >
                        {loading ? '...' : editId ? <Save size={20} /> : <Sparkles size={20} />}
                    </button>
                </div>
            </form>

            {/* LISTADO DE SALAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salas.map((s) => (
                    <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-4 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center text-blue-600" style={{ backgroundColor: s.color_sala || '#e0f2fe' }}>
                                    <DoorOpen size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700">{s.nombre}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sala / Consultorio</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => iniciarEdicion(s)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => eliminarSala(s)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GestionSalas;
