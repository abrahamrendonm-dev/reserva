import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DoorOpen, Trash2 } from 'lucide-react';

const GestionSalas = () => {
    const [salas, setSalas] = useState([]);
    const [nombre, setNombre] = useState('');

    const fetchSalas = async () => {
        const { data } = await supabase.from('salas').select('*');
        setSalas(data || []);
    };

    useEffect(() => { fetchSalas(); }, []);

    const addSala = async (e) => {
        e.preventDefault();
        await supabase.from('salas').insert([{ nombre, color_sala: '#f0f9ff' }]);
        setNombre('');
        fetchSalas();
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <DoorOpen className="text-blue-400" size={30} />
                <h2 className="text-2xl font-bold">Configuración de Salas</h2>
            </div>

            <form onSubmit={addSala} className="flex gap-4 mb-8">
                <input
                    type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Nombre de la sala (Ej: Consultorio 1)"
                    className="flex-1 p-3 rounded-2xl bg-white border-none shadow-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button className="bg-blue-400 text-white px-6 rounded-2xl font-bold hover:bg-blue-500 transition">Agregar</button>
            </form>

            <div className="grid gap-4">
                {salas.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                        <span className="font-medium text-gray-700">{s.nombre}</span>
                        <button onClick={async () => { await supabase.from('salas').delete().eq('id', s.id); fetchSalas(); }} className="text-red-300 hover:text-red-500">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GestionSalas;