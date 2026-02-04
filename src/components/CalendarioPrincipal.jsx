import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { useReservas, useTerapeutas, useSalas } from '../hooks/useSupabase';
import ModalReserva from './ModalReserva';
import { Users, Home, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarioPrincipal = () => {
    const calendarRef = useRef(null);
    const [mode, setMode] = useState('terapeutas');
    const [view, setView] = useState('resourceTimeGridDay');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectionInfo, setSelectionInfo] = useState(null);

    const { terapeutas } = useTerapeutas();
    const { salas } = useSalas();
    const { reservas, loading, refetch } = useReservas();

    const resources = useMemo(() => {
        const recursosList = mode === 'terapeutas' ? terapeutas : salas;
        return recursosList.map(r => ({
            id: r.id,
            title: r.nombre,
            extendedProps: { tipo: mode }
        }));
    }, [mode, terapeutas, salas]);

    const events = useMemo(() => {
        if (!reservas || !terapeutas) return [];
        return reservas.map(res => {
            const isBloqueo = res.tipo === 'bloqueo';
            const especialista = terapeutas.find(t => t.id === res.terapeuta_id);
            const colorBase = especialista?.color_calendario || '#ffd1dc';

            return {
                id: res.id,
                resourceId: mode === 'terapeutas' ? res.terapeuta_id : res.sala_id,
                title: isBloqueo ? `🚫 BLOQUEO: ${res.notas || 'No disponible'}` : (res.clientes?.nombre_completo || 'Cita'),
                start: res.fecha_inicio,
                end: res.fecha_fin,
                backgroundColor: isBloqueo ? '#f472b6' : (mode === 'terapeutas' ? colorBase : '#fff1f2'),
                borderColor: isBloqueo ? '#ec4899' : colorBase,
                textColor: isBloqueo ? '#ffffff' : '#9d174d',
                extendedProps: { reserva: res }
            };
        });
    }, [reservas, mode, terapeutas]);

    const handleDateSelect = (selectInfo) => {
        setSelectionInfo({
            startStr: selectInfo.startStr,
            endStr: selectInfo.endStr,
            resource: selectInfo.resource,
            isEdit: false
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo) => {
        setSelectionInfo({
            reserva: clickInfo.event.extendedProps.reserva,
            isEdit: true
        });
        setIsModalOpen(true);
    };

    const changeView = (viewType) => {
        setView(viewType);
        calendarRef.current.getApi().changeView(viewType);
    };

    return (
        <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-pink-50 h-[90vh] flex flex-col font-['Quicksand']">

            <div className="flex justify-between items-center mb-8 px-2">

                {/* Selector de Modo con el rosa suave del logo */}
                <div className="flex bg-pink-50/50 p-1.5 rounded-full border border-pink-100">
                    <button onClick={() => setMode('terapeutas')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${mode === 'terapeutas' ? 'bg-white shadow-md text-pink-500 font-bold' : 'text-pink-300 hover:text-pink-400'}`}>
                        <Users size={18} /> <span className="text-sm font-bold">Especialistas</span>
                    </button>
                    <button onClick={() => setMode('salas')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${mode === 'salas' ? 'bg-white shadow-md text-pink-500 font-bold' : 'text-pink-300 hover:text-pink-400'}`}>
                        <Home size={18} /> <span className="text-sm font-bold">Salas</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Selector Día/Semana - Rosa Corazón Vida Materna */}
                    <div className="flex bg-pink-400 p-1 rounded-full shadow-lg shadow-pink-100">
                        <button
                            onClick={() => changeView('resourceTimeGridDay')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${view === 'resourceTimeGridDay' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-50 hover:text-white'}`}
                        >
                            DÍA
                        </button>
                        <button
                            onClick={() => changeView('resourceTimeGridWeek')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${view === 'resourceTimeGridWeek' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-50 hover:text-white'}`}
                        >
                            SEMANA
                        </button>
                    </div>

                    {/* Navegación Suave */}
                    <div className="flex gap-2">
                        <div className="flex bg-pink-400 rounded-full overflow-hidden shadow-md">
                            <button onClick={() => calendarRef.current.getApi().prev()} className="p-3 text-white hover:bg-pink-500 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <div className="w-[1px] bg-pink-300 my-2"></div>
                            <button onClick={() => calendarRef.current.getApi().next()} className="p-3 text-white hover:bg-pink-500 transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button onClick={() => calendarRef.current.getApi().today()} className="px-6 py-2 bg-pink-50 text-pink-500 rounded-full font-bold text-sm hover:bg-pink-100 transition-all border border-pink-100">
                            Hoy
                        </button>
                    </div>

                    <button onClick={() => refetch()} className={`p-2 text-pink-200 hover:text-pink-400 transition-colors ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={22} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-[2.5rem] border border-pink-50 shadow-sm bg-white">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[resourceTimeGridPlugin, interactionPlugin]}
                    initialView={view}
                    resources={resources}
                    events={events}
                    locale={esLocale}
                    allDaySlot={false}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    height="100%"
                    selectable={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    nowIndicator={true}
                    headerToolbar={false}
                    selectMirror={true}
                    selectAllow={(selectInfo) => new Date(selectInfo.start) >= new Date().setMinutes(new Date().getMinutes() - 5)}
                    slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                />
            </div>

            <ModalReserva
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectionInfo={selectionInfo}
                onSave={refetch}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .fc-timegrid-now-indicator-line { border-color: #f472b6 !important; }
                .fc-timegrid-now-indicator-arrow { border-color: #f472b6 !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
                .fc-col-header-cell { background-color: #fff !important; padding: 12px 0 !important; border-bottom: 2px solid #fff1f2 !important; }
                .fc-col-header-cell-cushion { color: #db2777 !important; font-weight: 700 !important; }
                .fc-slot-label-cushion { color: #f9a8d4 !important; font-size: 11px !important; }
                .fc-highlight { background: rgba(fee2e2, 0.4) !important; }
            `}} />
            <style dangerouslySetInnerHTML={{
                __html: `
    /* Ocultar el mensaje de licencia inválida */
    .fc-license-message { display: none !important; }

    /* Estilos existentes que ya teníamos */
    .fc-timegrid-now-indicator-line { border-color: #f472b6 !important; }
    .fc-timegrid-now-indicator-arrow { border-color: #f472b6 !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
    .fc-col-header-cell { background-color: #fff !important; padding: 12px 0 !important; border-bottom: 2px solid #fff1f2 !important; }
    .fc-col-header-cell-cushion { color: #db2777 !important; font-weight: 700 !important; }
    .fc-slot-label-cushion { color: #f9a8d4 !important; font-size: 11px !important; }
    .fc-highlight { background: rgba(254, 226, 226, 0.4) !important; }
`}} />
        </div>
    );
};

export default CalendarioPrincipal;