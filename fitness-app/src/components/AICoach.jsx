import React, { useState, useRef, useEffect } from 'react';
import { calculateOverallReadiness, getMuscleRecoveryState } from '../utils/recoveryEngine';
import {
  sendGroqChatMessage,
  getStoredAuthKey,
  saveAuthKey,
  AI_MODELS,
  generateLocalTacticalFallback,
} from '../services/groqService';
import { marked } from 'marked';
import {
  Sparkles,
  RotateCcw,
  Send,
  Plus,
  Check,
  Copy,
  Dumbbell,
  Zap,
  Flame,
  Activity,
  Bot,
  User,
} from 'lucide-react';
import BatLogo from './BatLogo';

// Configure marked for clean GFM and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function AICoach({
  muscleStates,
  dailyRoutine,
  userProfile,
  onApplySuggestedWorkout,
  onAutoLogParsedWorkout,
}) {
  const overallReadiness = calculateOverallReadiness(muscleStates);

  // Neural Inference API & Model State
  const [apiKey] = useState(getStoredAuthKey());
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('fitbat_selected_ai_model');
    const isValid = AI_MODELS.some((m) => m.id === saved);
    return isValid ? saved : 'openai/gpt-oss-120b';
  });

  // Chat State
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // Persist the user's API key automatically from env if available
  useEffect(() => {
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (envKey) {
      saveAuthKey(envKey);
    }
  }, []);

  // Initial Welcome Message
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'c-welcome',
      sender: 'coach',
      text: `### Physical Protocol Calibrated
Greetings, **${userProfile?.name || 'Athlete'}**. I am **KING BAT AI**, your dedicated physical conditioning and hypertrophy advisor.

- **Muscle Recovery Score**: **${overallReadiness}% Readiness**
- **Current Objective**: **${userProfile?.goal ? userProfile.goal.toUpperCase() : 'LEAN MASS HYPERTROPHY'}**
- **Bodyweight**: **${userProfile?.weight > 0 ? `${userProfile.weight} ${userProfile.weightUnit}` : 'Tactical Baseline'}**

Ask me to design today's split based on your rested muscles, audit your nutrition targets, or analyze exercise execution.`,
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  // Extract muscle recovery breakdown for system context
  const getFatiguedMuscles = () => {
    return Object.keys(muscleStates).filter((k) => {
      const s = getMuscleRecoveryState(muscleStates[k], k);
      return s.colorTier === 'dark_red';
    });
  };

  const getRestedMuscles = () => {
    return Object.keys(muscleStates).filter((k) => {
      const s = getMuscleRecoveryState(muscleStates[k], k);
      return s.colorTier === 'white';
    });
  };

  // Build specialized system prompt with user biometrics
  const buildSystemPrompt = () => {
    const fatigued = getFatiguedMuscles().join(', ') || 'None';
    const rested = getRestedMuscles().join(', ') || 'All muscle groups';

    return `You are KING BAT AI, the elite fitness intelligence coach and hypertrophy advisor for FITBAT.
Your persona is disciplined, sharp, encouraging, concise, scientifically accurate, and inspired by high-performance physical conditioning.

User Biometrics:
- Call-Sign / Name: ${userProfile?.name || 'Athlete'}
- Bodyweight: ${userProfile?.weight > 0 ? `${userProfile.weight} ${userProfile.weightUnit}` : '78 kg'}
- Height: ${userProfile?.height > 0 ? `${userProfile.height} ${userProfile.heightUnit}` : '180 cm'}
- Fitness Goal: ${userProfile?.goal || 'Lean Muscle Hypertrophy & Strength'}
- Discipline Level: ${userProfile?.level || 'Vigilante'}
- Overall Recovery Score: ${overallReadiness}%
- Fatigued Muscles (<24h): ${fatigued}
- Rested & Prime Muscles (>72h): ${rested}

Formatting Rules:
1. Always format responses clearly using Markdown.
2. Use '### Header' for main section titles.
3. Use numbered lists (1. 2. 3.) for exercise protocols with exercise name in bold, e.g.:
   1. **Incline Dumbbell Press**: 3 sets × 8-10 reps (RPE 8.5)
4. Use bullet points (- ) for tips, rest intervals, and nutrition facts.
5. Strictly prioritize training muscles that are rested; safeguard fatigued muscles.
6. Keep formatting clean, aligned, and professional.`;
  };

  // Safe and clean Markdown Renderer
  const renderFormattedContent = (rawText) => {
    try {
      const parsedHtml = marked.parse(rawText || '');
      return (
        <div
          className="ai-markdown-content"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      );
    } catch (err) {
      return (
        <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-neutral-200 text-left">
          {rawText}
        </div>
      );
    }
  };

  // Send message handler (Direct Groq Cloud LLM Call)
  const handleSendMessage = async (textToSend = null) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // Live Neural Inference Call with multi-model fallback
      const reply = await sendGroqChatMessage({
        messages: [...chatMessages, userMessage],
        systemPrompt: buildSystemPrompt(),
        model: selectedModel,
        apiKey,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: 'coach',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // In case of total network disconnect, provide local tactical response
      const fallbackReply = generateLocalTacticalFallback({
        userPrompt: messageContent,
        systemPrompt: buildSystemPrompt(),
      });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: 'coach',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Preset Prompts
  const quickPrompts = [
    {
      title: 'Analyze Recovery Radar',
      prompt: 'Analyze my full-body muscle recovery status and advise today’s optimal workout split.',
      icon: Activity,
    },
    {
      title: 'Targeted Push Workout',
      prompt: 'Design a high-volume Chest, Shoulder, and Triceps protocol based on my rested muscles.',
      icon: Flame,
    },
    {
      title: 'Lower Body Session',
      prompt: 'Give me a high-intensity Quad and Hamstring workout with precise sets and rep targets.',
      icon: Dumbbell,
    },
    {
      title: 'Macro & Nutrition Audit',
      prompt: 'Calculate my exact daily protein, carb, and fat targets based on my bodyweight and fitness goal.',
      icon: Zap,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto h-[82vh] min-h-[640px] flex rounded-3xl overflow-hidden border border-[#1E2330] bg-[#07070A] shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
      {/* ================= LEFT CHATGPT SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#171A24] bg-[#050508] p-4 select-none justify-between">
        <div className="space-y-4">
          {/* New Protocol Button */}
          <button
            onClick={() => {
              setChatMessages([
                {
                  id: `c-${Date.now()}`,
                  sender: 'coach',
                  text: `### Protocol Cleared\nReady for your next command, **${userProfile?.name || 'Athlete'}**. What muscle groups are we focusing on?`,
                },
              ]);
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#0F0F14] hover:bg-neutral-900 border border-[#22222E] hover:border-white text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-between group shadow-md cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>New Protocol</span>
            </span>
            <BatLogo className="w-4 h-auto text-neutral-400 group-hover:text-white transition" />
          </button>

          {/* Intelligence Engine Status Card (Fully Configured & Active) */}
          <div className="p-3.5 rounded-2xl bg-[#0A0D14] border border-[#1C2232] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-white" /> Intelligence Core
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ONLINE</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                King Bat Neural Engine
              </span>
              <span className="text-[10px] font-mono text-neutral-300 bg-[#121622] px-2 py-0.5 rounded border border-[#232B3E]">
                High Speed
              </span>
            </div>

            {/* Model Selector Dropdown */}
            <div className="pt-1">
              <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1 font-bold">
                Neural Architecture:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  localStorage.setItem('fitbat_selected_ai_model', e.target.value);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#121622] border border-[#232B3E] text-white text-[11px] font-mono focus:outline-none focus:border-white transition cursor-pointer"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Protocols */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-1 font-bold">
              Tactical Presets
            </div>
            {quickPrompts.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#0D1018] border border-transparent hover:border-[#1E2434] transition text-xs group flex items-center gap-2.5 cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition flex-shrink-0" />
                  <span className="text-neutral-300 group-hover:text-white font-medium truncate">
                    {qp.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Biometrics Summary Footer */}
        <div className="pt-3 border-t border-[#171A24] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-bold uppercase truncate">
              {userProfile?.name || 'Athlete'}
            </span>
            <span className="font-mono text-white text-[11px] font-bold">
              {overallReadiness}% Rested
            </span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 truncate">
            {userProfile?.weight > 0 ? `${userProfile.weight} ${userProfile.weightUnit} • ` : ''}
            {userProfile?.goal ? userProfile.goal.toUpperCase() : 'FITBAT OS'}
          </div>
        </div>
      </aside>

      {/* ================= MAIN CHATGPT WORKSPACE ================= */}
      <main className="flex-1 flex flex-col bg-[#07070A] relative overflow-hidden">
        {/* Chat Header */}
        <header className="px-5 py-3.5 border-b border-[#181B26] bg-[#07070A]/95 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              <BatLogo className="w-6 h-auto text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-widest uppercase font-sans">
                  KING BAT AI COACH
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161C2C] text-neutral-200 border border-[#232C42]">
                  {selectedModel.includes('120b') ? '120B Flagship' : selectedModel.includes('20b') ? '20B Neural' : '27B Tactical'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Tactical AI Inference • Connected &amp; Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live System Active Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#0D1018] border border-[#1E2332] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
              <span className="text-[11px] font-mono text-white font-bold uppercase tracking-wider">
                CORE ONLINE
              </span>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={() => {
                setChatMessages([
                  {
                    id: `c-${Date.now()}`,
                    sender: 'coach',
                    text: `### Chat Cleared\nReady for your next workout inquiry, **${userProfile?.name || 'Athlete'}**.`,
                  },
                ]);
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition cursor-pointer"
              title="Clear chat history"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Feed (Clean, strictly left-aligned ChatGPT style) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 max-w-3xl ${
                  isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {/* Bat Coach Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                    <BatLogo className="w-5 h-auto text-black" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[90%]`}>
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed text-left ${
                      isUser
                        ? 'bg-white text-black font-semibold rounded-tr-xs shadow-lg'
                        : 'bg-[#0D1018] border border-[#1E2332] text-neutral-200 rounded-tl-xs shadow-md'
                    }`}
                  >
                    {/* Render Formatted Markdown without raw # symbols */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-black font-semibold text-left">
                        {msg.text}
                      </div>
                    ) : (
                      renderFormattedContent(msg.text)
                    )}
                  </div>

                  {/* Actions under message (Copy & Timestamp) */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pl-1">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      {msg.timestamp && (
                        <span className="text-[10px] font-mono text-neutral-600">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#1C202C] border border-[#2B3245] text-white flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold font-mono">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-3 text-neutral-400 text-xs font-mono animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                <BatLogo className="w-5 h-auto text-black" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#0D1018] border border-[#1E2332] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                <span className="text-neutral-400 text-xs ml-1 font-sans">
                  KING BAT AI is formulating tactical protocol...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Bar directly above input dock */}
        <div className="px-4 sm:px-8 py-2 overflow-x-auto scrollbar-none flex items-center gap-2 border-t border-[#131620] bg-[#07070A]/80">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex-shrink-0 font-bold">
            Quick Ask:
          </span>
          {[
            'Analyze muscle recovery radar',
            'Suggest a Push workout for rested muscles',
            'How much protein do I need today?',
            'Fastest way to recover sore quads',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#0E1119] border border-[#1F2536] text-neutral-300 hover:text-white hover:border-white transition flex-shrink-0 text-left cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Bottom Floating ChatGPT-Style Input Dock */}
        <div className="p-4 sm:p-5 border-t border-[#151822] bg-[#050508]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-[#0C0F17] border border-[#20283A] focus-within:border-white rounded-2xl p-1.5 pl-4 shadow-xl transition"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask KING BAT AI about workout splits, recovery radar, sets & reps..."
              disabled={isTyping}
              className="flex-1 bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition ${
                inputText.trim() && !isTyping
                  ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] font-mono text-neutral-500">
              Powered by King Bat Neural Core • High-Performance Inference
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
