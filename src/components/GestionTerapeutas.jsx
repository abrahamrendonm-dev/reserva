import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Trash2, Sparkles, Phone, Edit2, X, Save } from 'lucide-react';

const GestionTerapeutas = () => {
    const [terapeutas, setTerapeutas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null); // ID del terapeuta que estamos editando

    const [form, setForm] = useState({
        nombre: '',
        especialidad: '',
        color: '#ffd1dc',
        telefono: ''
    });

    const cargarTerapeutas = async () => {
        const { data } = await supabase.from('terapeutas').select('*').order('nombre');
        setTerapeutas(data || []);
    };

    useEffect(() => { cargarTerapeutas(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            nombre: form.nombre,
            especialidad: form.especialidad,
            color_calendario: form.color,
            telefono: form.telefono
        };

        if (editId) {
            // MODO ACTUALIZAR
            const { error } = await supabase.from('terapeutas').update(payload).eq('id', editId);
            if (error) alert(error.message);
            setEditId(null);
        } else {
            // MODO CREAR
            const { error } = await supabase.from('terapeutas').insert([payload]);
            if (error) alert(error.message);
        }

        setForm({ nombre: '', especialidad: '', color: '#ffd1dc', telefono: '' });
        cargarTerapeutas();
        setLoading(false);
    };

    const iniciarEdicion = (t) => {
        setEditId(t.id);
        setForm({
            nombre: t.nombre,
            especialidad: t.especialidad,
            color: t.color_calendario,
            telefono: t.telefono || ''
        });
        // Scroll hacia arriba para ver el formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicion = () => {
        setEditId(null);
        setForm({ nombre: '', especialidad: '', color: '#ffd1dc', telefono: '' });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto p-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-2xl text-pink-500">
                        {editId ? <Edit2 size={24} /> : <UserPlus size={24} />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700">{editId ? 'Editar Especialista' : 'Nuevo Especialista'}</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Vida Materna • Equipo</p>
                    </div>
                </div>
                {editId && (
                    <button onClick={cancelarEdicion} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase transition-colors">
                        <X size={16} /> Cancelar edición
                    </button>
                )}
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-50 mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Nombre</label>
                    <input
                        type="text" required placeholder="Ej: Dra. Ana García"
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100 text-sm"
                        value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Especialidad</label>
                    <input
                        type="text" required placeholder="Ej: Pediatría"
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100 text-sm"
                        value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Teléfono WhatsApp</label>
                    <input
                        type="tel" placeholder="Ej: 521..."
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100 text-sm"
                        value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
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
                        className={`h-[52px] px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editId ? 'bg-blue-500 shadow-blue-100' : 'bg-pink-400 shadow-pink-100'}`}
                    >
                        {loading ? '...' : editId ? <Save size={20} /> : <Sparkles size={20} />}
                    </button>
                </div>
            </form>

            {/* LISTADO DE ESPECIALISTAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terapeutas.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-4 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center text-white" style={{ backgroundColor: t.color_calendario }}>
                                    <span className="text-xl font-bold uppercase">{t.nombre.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700">{t.nombre}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{t.especialidad}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => iniciarEdicion(t)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={async () => {
                                    if (confirm(`¿Retirar a ${t.nombre} del equipo?`)) {
                                        await supabase.from('terapeutas').delete().eq('id', t.id);
                                        cargarTerapeutas();
                                    }
                                }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 p-3 rounded-xl">
                            <Phone size={14} className="text-pink-300" />
                            <span className="font-medium">{t.telefono || 'Sin teléfono registrado'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GestionTerapeutas;