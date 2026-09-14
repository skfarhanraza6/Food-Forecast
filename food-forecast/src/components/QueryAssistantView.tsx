import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { api } from '../api';
import { QueryAssistantResult } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  highlightData?: any;
  suggestedFollowUps?: string[];
  isAiPowered?: boolean;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  'What is today\'s buffer?',
  'What happens if 50 extra students arrive?',
  'How much food did we save this week?',
  'Which meal wastes the most food?',
  'How much money did we save?',
];

export const QueryAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your FOOD FORECAST Intelligence Assistant. Type any question below to inspect meal buffers, waste records, costs, or campus consumption.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res: QueryAssistantResult = await api.askQuery(queryText);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        highlightData: res.highlightData,
        suggestedFollowUps: res.suggestedFollowUps,
        isAiPowered: res.isAiPowered,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const botErrMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `I encountered an issue querying the database: ${err.message || 'Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botErrMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="query-assistant-view" className="space-y-4 pb-16 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-2">
            <span>Natural-Language Query Assistant</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/30 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Real DB + AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query real mess records, simulate turnouts, or ask about financial and environmental savings.
          </p>
        </div>
      </div>

      {/* Chat Messages Container in Shiny Black */}
      <div className="flex-1 card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-black text-[#10f072] border border-[#10f072]/50 shadow-[0_0_10px_rgba(16,240,114,0.3)]'
              }`}
            >
              {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs space-y-2 ${
                m.sender === 'user'
                  ? 'bg-zinc-900 border border-zinc-700 text-white rounded-tr-xs'
                  : 'bg-black/60 border border-zinc-800 text-slate-200 rounded-tl-xs shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-60 mb-1">
                <span className="font-bold">{m.sender === 'user' ? 'You' : 'FOOD FORECAST Assistant'}</span>
                <span>{m.timestamp}</span>
              </div>

              <div className="leading-relaxed whitespace-pre-line">{m.text}</div>

              {/* Data Card Highlight if Returned */}
              {m.highlightData && (
                <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-700 mt-2 space-y-1">
                  <div className="text-[10px] font-bold text-[#10f072] uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Verified Database Snapshot
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {typeof m.highlightData === 'object'
                      ? JSON.stringify(m.highlightData, null, 2)
                      : String(m.highlightData)}
                  </pre>
                </div>
              )}

              {/* Suggested Follow-Ups */}
              {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 w-full mb-0.5">Suggested queries:</span>
                  {m.suggestedFollowUps.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-slate-300 hover:text-[#10f072] hover:border-[#10f072] transition-colors flex items-center gap-1"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-[#10f072] border border-[#10f072]/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl bg-black/60 border border-zinc-800 text-slate-400 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10f072] animate-ping" />
              <span>Analyzing dining records & running predictive model...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
        <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1 shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Quick Ask:
        </span>
        {SAMPLE_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sq)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-[#10f072] text-[11px] text-slate-300 hover:text-white transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input Bar in Shiny Black */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="flex items-center gap-2"
      >
        <input
          id="assistant-query-input"
          type="text"
          placeholder="Ask anything about buffers, attendance, food waste, or financial savings..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 rounded-full border border-zinc-700 bg-zinc-900 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#10f072] shadow-xl"
        />
        <button
          id="assistant-send-btn"
          type="submit"
          disabled={!inputText.trim() || loading}
          className="btn-bubble-green px-5 py-3 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all disabled:opacity-40 flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
