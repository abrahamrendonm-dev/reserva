import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, Inbox } from 'lucide-react';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [emailSent, setEmailSent] = useState(false); // Nuevo estado para confirmación
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegister) {
                // REGISTRO CON CONFIRMACIÓN DE EMAIL
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                        emailRedirectTo: window.location.origin
                    }
                });

                if (error) throw error;

                // Si el registro es exitoso pero no hay sesión, es que requiere confirmación
                if (data?.user && !data?.session) {
                    setEmailSent(true);
                }
            } else {
                // INICIO DE SESIÓN
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
            }
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // VISTA DE "REVISA TU CORREO" (PREMIUM)
    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-4 font-['Quicksand']">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center space-y-6 border border-white">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-pink-400">
                        <Inbox size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">¡Casi listo, {fullName.split(' ')[0]}!</h2>
                    <p className="text-gray-500 leading-relaxed">
                        Hemos enviado un enlace de verificación a <span className="font-bold text-gray-700">{email}</span>.
                        Por favor, confírmalo para poder acceder a la agenda.
                    </p>
                    <button
                        onClick={() => { setEmailSent(false); setIsRegister(false); }}
                        className="w-full bg-pink-400 text-white p-4 rounded-2xl font-bold hover:bg-pink-500 transition-all shadow-lg shadow-pink-100"
                    >
                        Volver al Inicio de Sesión
                    </button>
                    <p className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">
                        Revisa tu carpeta de Spam si no lo recibes
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-4 font-['Quicksand']">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-pink-100/50 overflow-hidden border border-white relative">

                {/* Header Identidad Vida Materna */}
                <div className="bg-pink-400 p-10 text-center text-white relative">
                    <Heart className="mx-auto mb-4 animate-pulse" fill="white" size={40} />
                    <h1 className="text-2xl font-light tracking-widest uppercase">
                        Vida <span className="font-bold">Materna</span>
                    </h1>
                    <p className="text-pink-100 text-sm mt-2 font-medium tracking-wide">
                        Gestión de Bienestar
                    </p>
                </div>

                <form onSubmit={handleAuth} className="p-10 space-y-5 relative bg-white">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-700">
                            {isRegister ? 'Registro de Especialista' : 'Bienvenida(o) de nuevo'}
                        </h2>
                    </div>

                    {isRegister && (
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-pink-400 transition-colors" size={18} />
                            <input
                                type="text" placeholder="Nombre Completo" required
                                className="w-full pl-12 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all"
                                value={fullName} onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-pink-400 transition-colors" size={18} />
                        <input
                            type="email" placeholder="Email profesional" required
                            className="w-full pl-12 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-pink-400 transition-colors" size={18} />
                        <input
                            type="password" placeholder="Contraseña" required
                            className="w-full pl-12 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gray-800 text-white p-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-lg"
                    >
                        {loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar al Sistema'}
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="pt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-gray-400 font-medium hover:text-pink-500 transition-colors"
                        >
                            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nueva(o) especialista? Regístrate aquí'}
                        </button>
                    </div>
                </form>

                <div className="p-6 bg-gray-50/50 border-t border-gray-50 text-center">
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">
                        Acceso restringido • Personal Autorizado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;