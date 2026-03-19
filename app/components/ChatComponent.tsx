"use client";

import { useState, useRef, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import AuthScreen from "./AuthScreen";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const LOCAL_STORAGE_CONVERSATION_PREFIX = "chat_conversation_id_";

function createConversationId() {
  return crypto.randomUUID();
}

function getConversationStorageKey(userId: string) {
  return `${LOCAL_STORAGE_CONVERSATION_PREFIX}${userId}`;
}

function getOrCreateConversationId(userId: string) {
  const storageKey = getConversationStorageKey(userId);
  const storedId = window.localStorage.getItem(storageKey);

  if (storedId && storedId.trim()) {
    return storedId;
  }

  const newId = createConversationId();
  window.localStorage.setItem(storageKey, newId);
  return newId;
}

function safeConversationIdForUser(userId: string) {
  if (typeof window === "undefined" || !userId) {
    return createConversationId();
  }

  return getOrCreateConversationId(userId);
}

export default function ChatComponent() {
  const supabase = getSupabaseBrowserClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAuthLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthLoading(false);
      setMessages([]);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user || !session?.access_token) {
      return;
    }

    const loadHistory = async () => {
      const conversationId = safeConversationIdForUser(user.id);
      conversationIdRef.current = conversationId;

      try {
        const response = await fetch(
          `/api/chat?conversationId=${encodeURIComponent(conversationId)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "No se pudo cargar el historial del chat.");
        }

        if (!Array.isArray(data.messages)) {
          return;
        }

        const loadedMessages: Message[] = data.messages.map(
          (message: {
            id: string;
            role: "user" | "assistant";
            content: string;
            created_at: string;
          }) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.created_at),
          })
        );

        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      }
    };

    void loadHistory();
  }, [user, session]);

  const postChatMessage = async (payload: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId: string;
  }) => {
    if (!session?.access_token) {
      throw new Error("No autorizado: inicia sesion para continuar.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      return await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !user) return;

    if (!conversationIdRef.current) {
      conversationIdRef.current = safeConversationIdForUser(user.id);
    }

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        messages: [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user" as const, content: input },
        ],
        conversationId: conversationIdRef.current,
      };

      let response: Response;
      try {
        response = await postChatMessage(payload);
      } catch {
        // Retry once for transient dev-server/network hiccups.
        response = await postChatMessage(payload);
      }

      const data = await response.json();

      if (typeof data.conversationId === "string" && data.conversationId) {
        conversationIdRef.current = data.conversationId;
        window.localStorage.setItem(getConversationStorageKey(user.id), data.conversationId);
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Error en la respuesta del servidor");
      }

      // Agregar mensaje del asistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      const errorText =
        error instanceof DOMException && error.name === "AbortError"
          ? "La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo."
          : error instanceof TypeError
          ? "No se pudo conectar con el servidor. Asegúrate de que `npm run dev` esté activo y recarga la página."
          : error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar tu mensaje.";

      // Agregar mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Lo siento, ocurrió un error: ${errorText}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-12 w-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-indigo-700 dark:text-indigo-300 font-medium">Cargando sesion...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(newUser, newSession) => {
      setUser(newUser);
      setSession(newSession);
    }} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-900 shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              📚 Chat Académico
            </h1>
            <p className="text-indigo-100 text-sm">Unidad 1: Dispositivos Móviles</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm">{user?.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-indigo-300 dark:scrollbar-thumb-indigo-700">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">💡</div>
              <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-3">
                Bienvenido
              </h2>
              <p className="text-indigo-700 dark:text-indigo-300 max-w-sm">
                Haz preguntas sobre Dispositivos Móviles y Sistemas Operativos. El IA responderá con base en la Unidad 1.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-5 py-3 rounded-2xl shadow-sm transition-all ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-indigo-100 dark:border-indigo-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{message.content}</p>
                  <span className={`text-xs mt-2 block opacity-70 ${
                    message.role === "user" ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800 px-5 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 px-6 py-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta sobre Unidad 1..."
            disabled={isLoading}
            className="flex-1 px-5 py-3 border border-indigo-200 dark:border-indigo-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
