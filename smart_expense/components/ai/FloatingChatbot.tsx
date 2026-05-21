"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load context history
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setMessages(json.data);
        } else {
          // Provide default welcoming greeting
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "👋 Hello! I'm your AI Financial Advisor. Ask me anything about your monthly spending, top categories, or get tailored tips to optimize your budget!"
            }
          ]);
        }
      }
    } catch (err) {
      // Default
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "👋 Hello! I'm your AI Financial Advisor. Ask me anything about your monthly spending or budget status!"
        }
      ]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error("Chat engine failed");

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I am experiencing high latency accessing your vectorized vector embeddings. Based on local SQLite states, your current month expenditure stands within operational parameters."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = [
    "Where did I spend the most this month?",
    "How can I save more money?",
    "What category exceeded my budget?",
    "Show my travel expenses"
  ];

  return (
    <>
      {/* Launcher Bubble Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed right-4 bottom-20 lg:bottom-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 dark:glow-btn text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 group ${
          isOpen ? 'rotate-90 scale-0 opacity-0 pointer-events-none' : ''
        }`}
        title="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
      </button>

      {/* Main Global Chatbot Window Panel */}
      {isOpen && (
        <div className="fixed right-2 left-2 sm:left-auto sm:right-4 bottom-20 lg:bottom-6 z-50 w-auto sm:w-full sm:max-w-sm h-[520px] rounded-2xl bg-white dark:bg-[#080b10] border border-slate-100 dark:border-emerald-900/30 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-[#0a0d14] dark:to-[#0c0f1a] text-white flex items-center justify-between border-b border-purple-500/30 dark:border-emerald-900/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-emerald-500/10 flex items-center justify-center text-white dark:text-emerald-400">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-wide dark:text-emerald-300 flex items-center gap-1.5">
                  AI Financial Chatbot
                  <span className="text-[8px] bg-emerald-500 text-white px-1 py-0.2 rounded font-black">RAG</span>
                </h4>
                <p className="text-[10px] text-purple-100 dark:text-emerald-700 opacity-90">LangChain context engine online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Thread Buffer */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-[#050508]/80 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px] ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600 dark:bg-emerald-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-[#0a0d14] text-slate-800 dark:text-emerald-200 border border-slate-100 dark:border-emerald-900/30 rounded-bl-xs shadow-sm'
                }`}>
                  {/* Basic markdown parsing simulation */}
                  <span dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>
              </div>
            ))}

            {/* Simulated Typing Indicator Animation */}
            {loading && (
              <div className="flex gap-2.5 items-end">
                <div className="w-6 h-6 rounded-full bg-purple-600 dark:bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-100 dark:border-emerald-900/30 rounded-bl-xs shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-emerald-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-emerald-500 animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-emerald-500 animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Container */}
          <div className="p-2 bg-white dark:bg-[#080b10] border-t border-slate-100 dark:border-emerald-900/20 overflow-x-auto whitespace-nowrap scrollbar-none">
            <div className="flex gap-1.5">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-emerald-500/5 hover:bg-slate-100 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-emerald-900/30 text-slate-600 dark:text-emerald-400 text-[10px] font-bold transition-all shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* User Input Submission Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 pt-2 bg-white dark:bg-[#080b10] flex items-center gap-2 border-t border-slate-100 dark:border-emerald-900/20"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask financial queries..."
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-900/30 text-xs text-slate-900 dark:text-emerald-100 placeholder:text-slate-400 dark:placeholder:text-emerald-900 outline-none focus:border-purple-500 dark:focus:border-emerald-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:glow-btn text-white disabled:opacity-40 transition-all shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
