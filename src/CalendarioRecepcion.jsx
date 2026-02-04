import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { supabase } from './supabaseClient';
import { useTerapeutas, useReservas } from '../hooks/useSupabase';
import { Calendar as CalIcon, MessageCircle } from 'lucide-react';

const CalendarioRecepcion = () => {
    const { terapeutas } = useTerapeutas();
    const { reservas, refetch: refetchReservas } = useReservas();

    const events = useMemo(() => {
        if (!reservas) return [];
        return reservas.map(res => ({
            id: res.id,
            title: `${res.clientes?.nombre_completo} c/ ${res.terapeutas?.nombre}`,
            start: res.fecha_inicio,
            end: res.fecha_fin,
            backgroundColor: res.terapeutas?.color_calendario,
            borderColor: 'transparent',
            textColor: '#444'
        }));
    }, [reservas]);

    const handleDateSelect = async (selectInfo) => {
        // Usamos prompts sencillos por funcionalidad, pero el diseño del calendario es premium
        const nombre = prompt("Nombre de la Mamá:");
        if (!nombre) return;

        const telefono = prompt("WhatsApp (ej: 521XXXXXXXXXX):");

        // Mostramos lista de terapeutas para copiar el ID (En un modal sería un dropdown)
        const listaT = terapeutas.map((t, i) => `${i + 1}. ${t.nombre}`).join('\n');
        const index = prompt(`Selecciona terapeuta (número):\n${listaT}`);
        const terapeutaSeleccionada = terapeutas[parseInt(index) - 1];

        if (terapeutaSeleccionada) {
            // 1. Crear cliente (simplificado)
            const { data: cliente } = await supabase.from('clientes').insert([
                { nombre_completo: nombre, telefono_whatsapp: telefono }
            ]).select().single();

            // 2. Crear reserva
            const { error } = await supabase.from('reservas').insert([{
                fecha_inicio: selectInfo.startStr,
                fecha_fin: selectInfo.endStr,
                terapeuta_id: terapeutaSeleccionada.id,
                cliente_id: cliente.id
            }]);

            if (!error) {
                // WhatsApp con link de calendario (opcional)
                const msj = `¡Hola ${nombre}! Confirmamos tu cita en Vida Materna. \n📅 ${new Date(selectInfo.startStr).toLocaleDateString()} \n🕒 ${new Date(selectInfo.startStr).toLocaleTimeString()}`;
                window.open(`httpshttps://wa.me/${telefono}?text=${encodeURIComponent(msj)}`, '_blank');
                refetchReservas();
            }
        }
        selectInfo.view.calendar.unselect();
    };

    return (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-50" style={{ height: '75vh' }}>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={esLocale}
                events={events}
                selectable={true}
                select={handleDateSelect}
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                height="100%"
                nowIndicator={true}
                eventClassNames="rounded-lg border-none shadow-sm font-medium text-xs p-1"
            />
        </div>
    );
};

export default CalendarioRecepcion;