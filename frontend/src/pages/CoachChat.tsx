import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MainLayout } from '../components/Layout';
import { Card, Button, PremiumFeatureGate, Textarea } from '../components/Common';
import { aiAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import heroImage from '../assets/hero.png';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  meta?: string;
};

type ApiErrorResponse = {
  message?: string;
};

const starterPrompts = [
  'I missed two workouts this week. How should I adjust without falling behind?',
  'Give me a simple fat-loss meal structure for a packed workday.',
  'My recovery has been slow lately. What should I change first?',
];

export const CoachChatPage: React.FC = () => {
  const { user } = useAuth();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldSmoothScrollRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateHistory = async () => {
      if (!hasPremiumAccess) {
        if (isMounted) {
          setMessages([]);
          setIsHydrating(false);
        }
        return;
      }

      try {
        const response = await aiAPI.getHistory(1, 6, 'coach-chat');
        if (!isMounted) {
          return;
        }

        const hydratedMessages = response.data.items
          .slice()
          .reverse()
          .flatMap((interaction) => {
            const historyMessages: ChatMessage[] = [];
            const promptMessage = interaction.promptPayload?.message;

            if (typeof promptMessage === 'string' && promptMessage.trim().length > 0) {
              historyMessages.push({
                id: `${interaction.id}-user`,
                role: 'user',
                content: promptMessage.trim(),
              });
            }

            if (interaction.outputText.trim().length > 0) {
              historyMessages.push({
                id: `${interaction.id}-assistant`,
                role: 'assistant',
                content: interaction.outputText.trim(),
                meta: `${interaction.provider} | ${interaction.model}`,
              });
            }

            return historyMessages;
          });
        setMessages(hydratedMessages);
      } catch {
        if (isMounted) {
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    void hydrateHistory();

    return () => {
      isMounted = false;
    };
  }, [hasPremiumAccess]);

  useEffect(() => {
    if (!messagesEndRef.current || messages.length === 0) {
      return;
    }

    const shouldAnimate = shouldSmoothScrollRef.current || isSending;
    messagesEndRef.current.scrollIntoView({
      behavior: shouldAnimate ? 'smooth' : 'auto',
      block: 'end',
    });

    shouldSmoothScrollRef.current = true;
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    if (!hasPremiumAccess) {
      setError('Premium subscription required to use the AI coach.');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    shouldSmoothScrollRef.current = true;
    setMessage('');
    setError('');
    setIsSending(true);

    try {
      const response = await aiAPI.coachChat(trimmedMessage);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        meta: `${response.data.provider} | ${response.data.model}`,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.message
        : undefined;

      setError(nextError || 'The coach could not respond right now. Please try again.');
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            'I hit a temporary issue while generating a reply. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MainLayout>
      {!hasPremiumAccess ? (
        <PremiumFeatureGate
          eyebrow="Premium coach"
          title="AI coach chat is unlocked on the premium plan."
          description="Upgrade to premium to access real AI coaching, stored coach history, and sharper weekly recovery or diet adjustments."
        />
      ) : (
      <div className="w-full space-y-6 lg:space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.1),transparent_28%)]" />
              <div className="relative max-w-3xl space-y-5">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00FF88] backdrop-blur">
                  Coach Mode
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl font-black leading-[0.95] text-[#F7F7F7] sm:text-4xl lg:text-[3.5rem]">
                    Ask one sharp question.
                    <span className="block text-[#98a3b8]">Get one useful next move.</span>
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[#b8c0d2] sm:text-base">
                    Use the coach for training adjustments, recovery decisions, and practical diet
                    fixes when real life throws your week off.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f97ab]">Status</p>
                    <p className="mt-2 text-lg font-bold text-[#00FF88]">
                      {isSending ? 'Thinking' : 'Ready'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f97ab]">Messages</p>
                    <p className="mt-2 text-lg font-bold text-[#F7F7F7]">{messages.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f97ab]">Focus</p>
                    <p className="mt-2 text-lg font-bold text-[#F7F7F7]">Recovery and consistency</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">
                    Try one of these
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {starterPrompts.map((prompt, index) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setMessage(prompt)}
                        className="rounded-full border border-[#2e303a] bg-[#11131d]/90 px-4 py-2.5 text-left text-sm text-[#d8dce6] transition-all duration-300 motion-safe:[animation:fadeUp_420ms_ease-out] motion-safe:hover:-translate-y-1 motion-safe:hover:border-[#00FF88]/45 motion-safe:hover:bg-[#141a28]"
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] overflow-hidden border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
              <img src={heroImage} alt="Coach visual" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,10,18,0.26)_0%,rgba(7,10,18,0.58)_50%,rgba(7,10,18,0.9)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="max-w-sm rounded-[1.75rem] border border-white/10 bg-black/35 p-5 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                    Better prompts
                  </p>
                  <p className="mt-3 text-xl font-bold leading-snug text-[#F7F7F7]">
                    Mention your goal, the problem, and what changed this week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-[#FF6B00] bg-[#FF6B00]/10 px-5 py-4 text-sm text-[#FFB27A]">
            {error}
          </div>
        ) : null}

        <Card
          variant="glass"
          className="overflow-hidden rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(18,22,36,0.92)_0%,rgba(13,16,28,0.98)_100%)] p-0"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">
                Conversation
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#F7F7F7]">AI Coach Chat</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMessages([]);
                setError('');
              }}
              disabled={isSending || isHydrating}
              className="border-white/10 bg-white/5"
            >
              Clear Chat
            </Button>
          </div>

          <div className="flex min-h-[560px] flex-col">
            <div className="flex-1 space-y-5 px-5 py-6 sm:px-7">
              {isHydrating ? (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-7 sm:py-8">
                  <div className="flex items-center gap-2 text-sm text-[#aeb7cb]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00FF88]"></span>
                    Loading recent coach context...
                  </div>
                </div>
              ) : null}

              {messages.length === 0 && !isSending && !isHydrating ? (
                <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6 sm:px-7 sm:py-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                    Warm start
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-[#F7F7F7]">
                    Start with the thing blocking you most.
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9da8bf] sm:text-base">
                    Missed sessions, flat energy, diet confusion, or poor recovery are all good starting points.
                    Ask for the next adjustment, not the perfect plan.
                  </p>
                </div>
              ) : null}

              {messages.map((msg, index) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`chat-bubble-enter max-w-full rounded-[1.6rem] px-5 py-4 sm:max-w-2xl ${
                      msg.role === 'user'
                        ? 'bg-[linear-gradient(135deg,#fff8fd_0%,#f8ebff_42%,#dcefff_100%)] text-black shadow-[0_18px_40px_rgba(255,255,255,0.1)]'
                        : 'border border-white/10 bg-white/[0.04] text-[#F7F7F7] shadow-[0_18px_36px_rgba(0,0,0,0.2)]'
                    }`}
                    style={{ animationDelay: `${Math.min(index * 35, 160)}ms` }}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">{msg.content}</p>
                    {msg.meta ? (
                      <p className={`mt-3 text-[11px] uppercase tracking-[0.18em] ${msg.role === 'user' ? 'text-[#4a5162]' : 'text-[#8f97ab]'}`}>
                        {msg.meta}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-[#F7F7F7]">
                    <div className="flex items-center gap-2 text-sm text-[#aeb7cb]">
                      <div className="flex items-center gap-1.5">
                        <span className="thinking-dot h-2 w-2 rounded-full bg-[#00FF88]"></span>
                        <span className="thinking-dot h-2 w-2 rounded-full bg-[#8ef7c7]" style={{ animationDelay: '120ms' }}></span>
                        <span className="thinking-dot h-2 w-2 rounded-full bg-[#cab8ff]" style={{ animationDelay: '240ms' }}></span>
                      </div>
                      Coach is thinking...
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 bg-black/15 px-5 py-5 sm:px-7">
              <div className="space-y-3">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  rows={5}
                  placeholder="Ask about your training, recovery, diet, or how to adjust the week..."
                  className="min-h-[132px] rounded-[1.5rem] border-white/10 bg-white/[0.04] px-5 py-4"
                  disabled={isSending || isHydrating}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#8f97ab]">
                    Press Enter to send. Use Shift + Enter for a new line.
                  </p>
                  <Button
                    variant="accent"
                    size="md"
                    onClick={() => void handleSendMessage()}
                    disabled={!message.trim() || isHydrating}
                    isLoading={isSending}
                    className="self-start sm:self-auto"
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}
    </MainLayout>
  );
};
