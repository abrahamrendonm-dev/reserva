import React, { useState, useMemo, useRef, useEffect } from 'react';
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
    const [currentTitle, setCurrentTitle] = useState(''); // Estado para la fecha actual

    const { terapeutas } = useTerapeutas();
    const { salas } = useSalas();
    const { reservas, loading, refetch } = useReservas();

    // Función para actualizar el título de la fecha
    const handleDatesSet = (arg) => {
        setCurrentTitle(arg.view.title);
    };

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
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-xl border border-pink-50 h-[95vh] md:h-[90vh] flex flex-col font-['Quicksand']">

            {/* Header Responsivo */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 px-2">

                {/* Selector Especialistas/Salas */}
                <div className="flex bg-pink-50/50 p-1 rounded-full border border-pink-100 w-full lg:w-auto shadow-sm">
                    <button onClick={() => setMode('terapeutas')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-full transition-all ${mode === 'terapeutas' ? 'bg-white shadow-md text-pink-500 font-bold' : 'text-pink-300'}`}>
                        <Users size={16} /> <span className="text-xs md:text-sm font-bold">Especialistas</span>
                    </button>
                    <button onClick={() => setMode('salas')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-full transition-all ${mode === 'salas' ? 'bg-white shadow-md text-pink-500 font-bold' : 'text-pink-300'}`}>
                        <Home size={16} /> <span className="text-xs md:text-sm font-bold">Salas</span>
                    </button>
                </div>

                {/* Fecha Actual Dinámica */}
                <div className="order-first lg:order-none">
                    <h2 className="text-lg md:text-xl font-bold text-pink-700 capitalize">
                        {currentTitle}
                    </h2>
                </div>

                {/* Controles de Navegación */}
                <div className="flex flex-wrap justify-center items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-pink-400 p-1 rounded-full shadow-lg">
                        <button onClick={() => changeView('resourceTimeGridDay')} className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black transition-all ${view === 'resourceTimeGridDay' ? 'bg-white text-pink-500 shadow-sm' : 'text-white hover:text-pink-50'}`}>
                            DÍA
                        </button>
                        <button onClick={() => changeView('resourceTimeGridWeek')} className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black transition-all ${view === 'resourceTimeGridWeek' ? 'bg-white text-pink-500 shadow-sm' : 'text-white hover:text-pink-50'}`}>
                            SEM
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-pink-400 rounded-full shadow-md overflow-hidden">
                            <button onClick={() => calendarRef.current.getApi().prev()} className="p-2.5 text-white hover:bg-pink-500 border-r border-pink-300/30">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => calendarRef.current.getApi().next()} className="p-2.5 text-white hover:bg-pink-500">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button onClick={() => calendarRef.current.getApi().today()} className="px-5 py-2 bg-pink-50 text-pink-500 rounded-full font-bold text-xs border border-pink-100 shadow-sm hover:bg-white transition-all">
                            Hoy
                        </button>
                    </div>

                    <button onClick={() => refetch()} className={`p-1 text-pink-200 hover:text-pink-400 transition-colors ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={22} />
                    </button>
                </div>
            </div>

            {/* Calendario */}
            <div className="flex-1 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border border-pink-50 shadow-inner bg-white">
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
                    datesSet={handleDatesSet} // Captura el cambio de fecha/vista
                    selectMirror={true}
                    unselectAuto={true}
                    longPressDelay={50}
                    selectLongPressDelay={50}
                    eventLongPressDelay={50}
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
                .fc-license-message { display: none !important; }
                .fc-timegrid-now-indicator-line { border-color: #f472b6 !important; }
                .fc-timegrid-now-indicator-arrow { border-color: #f472b6 !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
                .fc-col-header-cell { background-color: #fff !important; padding: 12px 0 !important; border-bottom: 2px solid #fff1f2 !important; }
                .fc-col-header-cell-cushion { color: #db2790 !important; font-weight: 700 !important; font-size: 13px !important; text-transform: capitalize !important; }
                .fc-slot-label-cushion { color: #f9a8d4 !important; font-size: 11px !important; }
                .fc-highlight { background: rgba(254, 226, 226, 0.4) !important; }
                .fc-view-harness { pointer-events: auto !important; }
                .fc-timegrid-slots { cursor: pointer !important; }
                .fc-scroller::-webkit-scrollbar { width: 4px; }
                .fc-scroller::-webkit-scrollbar-thumb { background: #fce7f3; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default CalendarioPrincipal;