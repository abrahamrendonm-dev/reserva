import React, { useState, useEffect } from 'react';
import { useTerapeutas, useSalas, useCreateReserva } from '../hooks/useSupabase';
import { supabase } from '../supabaseClient';
import { X, User, Phone, Trash2, CheckCircle, Sparkles, MessageCircle, ArrowRight, ShieldAlert } from 'lucide-react';

const ModalReserva = ({ isOpen, onClose, selectionInfo, onSave }) => {
    const isEdit = !!selectionInfo?.isEdit;
    const { terapeutas } = useTerapeutas();
    const { salas } = useSalas();
    const { createReserva, loading: creating } = useCreateReserva();

    const [actionLoading, setActionLoading] = useState(false);
    const [isExistingClient, setIsExistingClient] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [form, setForm] = useState({
        nombreCliente: '', telefono: '', terapeutaId: '', salaId: '', notas: '',
        fechaInicio: '', fechaFin: '', tipo: 'cita'
    });

    // Búsqueda automática de cliente
    useEffect(() => {
        const buscarCliente = async () => {
            if (!isEdit && form.tipo === 'cita' && form.telefono.length >= 8) {
                const { data } = await supabase.from('clientes').select('nombre_completo').eq('telefono_whatsapp', form.telefono).maybeSingle();
                if (data) {
                    setForm(prev => ({ ...prev, nombreCliente: data.nombre_completo }));
                    setIsExistingClient(true);
                } else {
                    setIsExistingClient(false);
                }
            }
        };
        const timer = setTimeout(buscarCliente, 500);
        return () => clearTimeout(timer);
    }, [form.telefono, isEdit, form.tipo]);

    const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isOpen) {
            setShowSuccess(false);
            if (isEdit && selectionInfo?.reserva) {
                const { reserva } = selectionInfo;
                setForm({
                    nombreCliente: reserva.clientes?.nombre_completo || '',
                    telefono: reserva.clientes?.telefono_whatsapp || '',
                    terapeutaId: String(reserva.terapeuta_id),
                    salaId: reserva.sala_id ? String(reserva.sala_id) : '',
                    notas: reserva.notas || '',
                    fechaInicio: formatForInput(reserva.fecha_inicio),
                    fechaFin: formatForInput(reserva.fecha_fin),
                    tipo: reserva.tipo || 'cita'
                });
                setIsExistingClient(true);
            } else {
                const isSala = selectionInfo?.resource?.extendedProps?.tipo === 'sala';
                setForm({
                    nombreCliente: '', telefono: '',
                    terapeutaId: !isSala ? String(selectionInfo?.resource?.id || '') : '',
                    salaId: isSala ? String(selectionInfo?.resource?.id || '') : '',
                    notas: '',
                    fechaInicio: selectionInfo?.startStr ? selectionInfo.startStr.slice(0, 16) : '',
                    fechaFin: selectionInfo?.endStr ? selectionInfo.endStr.slice(0, 16) : '',
                    tipo: 'cita'
                });
                setIsExistingClient(false);
            }
        }
    }, [isOpen, selectionInfo, isEdit]);

    // Lógica de WhatsApp CORREGIDA
    const handleWhatsApp = (target) => {
        const esp = terapeutas.find(x => String(x.id) === String(form.terapeutaId));
        const fechaObj = new Date(form.fechaInicio);
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        const fechaFormateada = fechaObj.toLocaleString('es-MX', opciones);

        // 1. Obtener número base
        let numeroBruto = target === 'mama' ? form.telefono : esp?.telefono;

        // 2. Limpieza profunda: Solo números
        let numLimpio = numeroBruto ? String(numeroBruto).replace(/\D/g, '') : '';

        // 3. Formatear para México (si tiene 10 dígitos, ponerle el 52)
        if (numLimpio.length === 10) {
            numLimpio = `52${numLimpio}`;
        }

        const mensaje = target === 'mama'
            ? `Hola ${form.nombreCliente}, confirmamos tu cita en Vida Materna para el día ${fechaFormateada} con el especialista ${esp?.nombre || ''}.`
            : `Hola ${esp?.nombre}, tienes una nueva cita agendada para el día ${fechaFormateada}. Cliente: ${form.nombreCliente}.`;

        // 4. Abrir URL limpia sin el símbolo "+"
        window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const inicioDate = new Date(form.fechaInicio);
        const finDate = new Date(form.fechaFin);
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - 15);

        if (!isEdit && inicioDate < ahora) {
            alert("🚫 No puedes agendar en el pasado.");
            return;
        }

        if (inicioDate >= finDate) {
            alert("🚫 La hora de término debe ser posterior a la de inicio.");
            return;
        }

        setActionLoading(true);
        try {
            const inicioISO = inicioDate.toISOString();
            const finISO = finDate.toISOString();

            let query = supabase.from('reservas').select('id, terapeuta_id, sala_id')
                .lt('fecha_inicio', finISO).gt('fecha_fin', inicioISO);
            if (isEdit) query = query.neq('id', selectionInfo.reserva.id);

            const { data: conflictos } = await query;
            if (conflictos?.length > 0) {
                const choqueEsp = conflictos.find(c => String(c.terapeuta_id) === String(form.terapeutaId));
                if (choqueEsp) { alert("🚫 El especialista ya tiene una cita en este horario."); setActionLoading(false); return; }
            }

            const payload = {
                terapeuta_id: form.terapeutaId, sala_id: form.salaId || null,
                notas: form.notas, fecha_inicio: inicioISO, fecha_fin: finISO, tipo: form.tipo
            };

            if (isEdit) {
                await supabase.from('reservas').update(payload).eq('id', selectionInfo.reserva.id);
            } else {
                if (form.tipo === 'bloqueo') await supabase.from('reservas').insert([payload]);
                else await createReserva({ nombre_completo: form.nombreCliente, telefono_whatsapp: form.telefono }, payload);
            }
            onSave();
            if (!isEdit && form.tipo === 'cita') setShowSuccess(true);
            else onClose();
        } catch (error) { alert(error.message); } finally { setActionLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-['Quicksand']">
            {showSuccess ? (
                <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-8">¡Agendado con éxito!</h2>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleWhatsApp('mama')}
                            className="w-full flex items-center justify-between p-4 bg-pink-50 text-pink-600 rounded-2xl font-bold hover:bg-pink-100 transition-all"
                        >
                            <div className="flex items-center gap-3"><MessageCircle size={20} /> Notificar a Mamá</div>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() => handleWhatsApp('especialista')}
                            className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-all"
                        >
                            <div className="flex items-center gap-3"><MessageCircle size={20} /> Notificar a Especialista</div>
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <button onClick={onClose} className="text-gray-400 text-xs font-bold uppercase mt-8 hover:text-gray-600">Cerrar Ventana</button>
                </div>
            ) : (
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
                    <div className={`${form.tipo === 'bloqueo' ? 'bg-gray-800 text-white' : isEdit ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'} p-8 flex justify-between items-center transition-all`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white/20">
                                {form.tipo === 'bloqueo' ? <ShieldAlert /> : <CheckCircle />}
                            </div>
                            <h2 className="text-xl font-bold">{form.tipo === 'bloqueo' ? 'Bloqueo de Horario' : isEdit ? 'Editar Cita' : 'Nueva Cita'}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full"><X /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button type="button" onClick={() => setForm({ ...form, tipo: 'cita' })} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${form.tipo === 'cita' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>CITA MÉDICA</button>
                            <button type="button" onClick={() => setForm({ ...form, tipo: 'bloqueo' })} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${form.tipo === 'bloqueo' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}>BLOQUEO</button>
                        </div>

                        {form.tipo === 'cita' ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <input type="tel" placeholder="WhatsApp (10 dígitos)" required className="w-full pl-12 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-100" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                                    {isExistingClient && <Sparkles className="absolute right-4 top-4 text-green-500 animate-pulse" size={18} />}
                                </div>
                                <div className="relative">
                                    <User className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <input type="text" placeholder="Nombre de la Mamá" required className="w-full pl-12 py-4 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-100" value={form.nombreCliente} onChange={e => setForm({ ...form, nombreCliente: e.target.value })} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center animate-in zoom-in">
                                <p className="text-gray-500 text-xs font-medium italic">Este espacio se marcará como "No Disponible" en la agenda del especialista.</p>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-3xl grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Inicio</label>
                                <input type="datetime-local" required className="w-full p-3 bg-white rounded-xl text-sm outline-none" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Fin</label>
                                <input type="datetime-local" required className="w-full p-3 bg-white rounded-xl text-sm outline-none" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select required className="p-4 bg-gray-50 rounded-2xl text-sm outline-none" value={form.terapeutaId} onChange={e => setForm({ ...form, terapeutaId: e.target.value })}>
                                <option value="">Especialista...</option>
                                {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                            <select required={form.tipo === 'cita'} className="p-4 bg-gray-50 rounded-2xl text-sm outline-none" value={form.salaId} onChange={e => setForm({ ...form, salaId: e.target.value })}>
                                <option value="">Sala / Consultorio...</option>
                                {salas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>

                        <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-gray-100" placeholder="Notas adicionales..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />

                        <div className="flex gap-3 pt-2">
                            {isEdit && (
                                <button type="button" onClick={async () => { if (confirm("¿Seguro que deseas eliminar esta reserva?")) { await supabase.from('reservas').delete().eq('id', selectionInfo.reserva.id); onSave(); onClose(); } }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                                    <Trash2 size={24} />
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={actionLoading || creating}
                                className={`flex-1 p-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${form.tipo === 'bloqueo' ? 'bg-gray-800 hover:bg-gray-900' : isEdit ? 'bg-blue-500 hover:bg-blue-600' : 'bg-pink-400 hover:bg-pink-500'}`}
                            >
                                {actionLoading ? 'Validando...' : isEdit ? 'Guardar Cambios' : 'Confirmar Agenda'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ModalReserva;