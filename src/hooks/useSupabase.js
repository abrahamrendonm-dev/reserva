import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook para cargar y gestionar reservas con REALTIME
 */
export const useReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('reservas')
        .select(`
          *,
          terapeutas(id, nombre, color_calendario),
          salas(id, nombre),
          clientes(id, nombre_completo, telefono_whatsapp)
        `);

      if (err) throw err;
      setReservas(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();

    // SUSCRIPCIÓN EN TIEMPO REAL: Escucha cambios en la tabla 'reservas'
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reservas' },
        () => fetchReservas() // Recarga datos automáticamente ante cualquier cambio
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservas]);

  return { reservas, loading, error, refetch: fetchReservas };
};

/**
 * Hook para cargar terapeutas
 */
export const useTerapeutas = () => {
  const [terapeutas, setTerapeutas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTerapeutas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('terapeutas').select('*').order('nombre');
      if (error) throw error;
      setTerapeutas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTerapeutas(); }, []);
  return { terapeutas, loading, refetch: fetchTerapeutas };
};

/**
 * Hook para cargar salas
 */
export const useSalas = () => {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('salas').select('*').order('nombre');
      if (error) throw error;
      setSalas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalas(); }, []);
  return { salas, loading, refetch: fetchSalas };
};

/**
 * Hook para cargar el perfil (rol) del usuario autenticado
 */
export const usePerfil = (session) => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = useCallback(async () => {
    if (!session) {
      setPerfil(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) console.error(error);
    setPerfil(data);
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchPerfil(); }, [fetchPerfil]);

  return { perfil, loading, refetch: fetchPerfil };
};

/**
 * Hook para administradores: lista de todos los perfiles de usuarios
 */
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('updated_at');
    if (error) console.error(error);
    setUsuarios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  return { usuarios, loading, refetch: fetchUsuarios };
};

/**
 * Hook para la disponibilidad semanal de UN especialista (para editarla)
 */
export const useDisponibilidad = (terapeutaId) => {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisponibilidad = useCallback(async () => {
    if (!terapeutaId) {
      setDisponibilidad([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('disponibilidad_semanal')
      .select('*')
      .eq('terapeuta_id', terapeutaId)
      .order('dia_semana')
      .order('hora_inicio');
    if (error) console.error(error);
    setDisponibilidad(data || []);
    setLoading(false);
  }, [terapeutaId]);

  useEffect(() => { fetchDisponibilidad(); }, [fetchDisponibilidad]);

  return { disponibilidad, loading, refetch: fetchDisponibilidad };
};

/**
 * Hook para la disponibilidad semanal de TODOS los especialistas
 * (usado por la agenda para restringir horarios seleccionables por recurso)
 */
export const useDisponibilidadTodas = () => {
  const [porTerapeuta, setPorTerapeuta] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchTodas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('disponibilidad_semanal').select('*');
    if (error) console.error(error);
    const agrupado = {};
    (data || []).forEach(d => {
      if (!agrupado[d.terapeuta_id]) agrupado[d.terapeuta_id] = [];
      agrupado[d.terapeuta_id].push(d);
    });
    setPorTerapeuta(agrupado);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTodas(); }, [fetchTodas]);

  return { porTerapeuta, loading, refetch: fetchTodas };
};

/**
 * Hook Senior para crear reservas con validación de conflictos y Upsert de cliente
 */
export const useCreateReserva = () => {
  const [loading, setLoading] = useState(false);

  const createReserva = async (clienteData, reservaData) => {
    try {
      setLoading(true);

      // 1. VALIDACIÓN DE CONFLICTOS (Overbooking)
      // Verifica si existe alguna reserva en la misma sala O con el mismo terapeuta que se solape
      const { data: conflictos, error: errConf } = await supabase
        .from('reservas')
        .select('id')
        .or(`terapeuta_id.eq.${reservaData.terapeuta_id},sala_id.eq.${reservaData.sala_id}`)
        .lt('fecha_inicio', reservaData.fecha_fin)
        .gt('fecha_fin', reservaData.fecha_inicio);

      if (errConf) throw errConf;
      if (conflictos.length > 0) {
        throw new Error('Conflicto de horario: El especialista o la sala ya están ocupados en este rango.');
      }

      // 2. UPSERT DE CLIENTE (Evita duplicados por teléfono)
      // Usamos 'onConflict' para que si el teléfono ya existe, solo actualice el nombre
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .upsert(
          {
            nombre_completo: clienteData.nombre_completo,
            telefono_whatsapp: clienteData.telefono_whatsapp
          },
          { onConflict: 'telefono_whatsapp' }
        )
        .select()
        .single();

      if (errCliente) throw errCliente;

      // 3. CREAR RESERVA FINAL
      const { data: reserva, error: errReserva } = await supabase
        .from('reservas')
        .insert([{ ...reservaData, cliente_id: cliente.id }])
        .select()
        .single();

      if (errReserva) throw errReserva;

      return { success: true, reserva };
    } catch (err) {
      console.error('Error en proceso de reserva:', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createReserva, loading };
};