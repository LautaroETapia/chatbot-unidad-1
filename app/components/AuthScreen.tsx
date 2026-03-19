"use client";

import { useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AuthScreenProps {
  onAuthSuccess: (user: User, session: Session) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const supabase = getSupabaseBrowserClient();

  const [mode, setMode] = useState<"initial" | "login" | "signup">("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user || !data.session) throw new Error("No se obtuvo sesion");

      onAuthSuccess(data.user, data.session);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Error al iniciar sesion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSuccessMessage(
        "Cuenta creada! Revisa tu correo para confirmarla, luego inicia sesion."
      );
      setTimeout(() => {
        setMode("login");
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Error al crear cuenta"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "initial") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mb-3">
            Chat Académico
          </h1>
          <p className="text-lg text-indigo-700 dark:text-indigo-300">
            Aprende con IA sobre Dispositivos Móviles
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <button
            onClick={() => setMode("login")}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Tengo cuenta
          </button>

          <button
            onClick={() => setMode("signup")}
            className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-300 font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Crear cuenta nueva
          </button>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8 max-w-sm">
          Tus conversaciones se guardan automáticamente y solo tú puedes acceder a ellas.
        </p>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => {
                setMode("initial");
                setAuthError("");
                setEmail("");
                setPassword("");
              }}
              className="text-sm text-indigo-600 dark:text-indigo-300 hover:underline mb-4"
            >
              ← Volver
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Accede con tus credenciales
            </p>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-200"
              >
                {isSubmitting ? "Cargando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-emerald-950 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => {
                setMode("initial");
                setAuthError("");
                setSuccessMessage("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm text-emerald-600 dark:text-emerald-300 hover:underline mb-4"
            >
              ← Volver
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Crear cuenta
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Únete y comienza a aprender
            </p>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-200"
              >
                {isSubmitting ? "Creando..." : "Crear cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
