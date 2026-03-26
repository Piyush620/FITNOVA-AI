import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MainLayout } from '../components/Layout';
import { Card, Button, Input } from '../components/Common';
import { aiAPI } from '../services/api';

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

const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey! I'm your FitNova AI coach. Ask me about workouts, recovery, nutrition, consistency, or how to adjust your plan.",
};

export const CoachChatPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage('');
    setError('');
    setIsSending(true);

    try {
      const response = await aiAPI.coachChat(trimmedMessage);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        meta: `${response.data.provider} • ${response.data.model}`,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
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
      <div className="grid w-full gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="space-y-6">
          <Card variant="gradient" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
                AI Coach
              </p>
              <h1 className="text-3xl font-bold text-[#F7F7F7]">Real-time fitness guidance</h1>
            </div>
            <p className="text-sm leading-6 text-gray-400">
              Use this coach for training questions, meal tweaks, recovery decisions, and consistency problems while you work through your plans.
            </p>
            <div className="space-y-3 border-t border-[#2e303a] pt-4 text-sm text-gray-400">
              <p>Ask specific questions for better answers.</p>
              <p>Include your goal, current problem, and what equipment or food options you have.</p>
              <p>The chat resets locally if you clear it, but backend AI history is still stored.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setMessages([initialMessage]);
                setError('');
              }}
              disabled={isSending}
            >
              Clear Chat
            </Button>
          </Card>
        </section>

        <section className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FF6B00]">
              {error}
            </div>
          ) : null}

          <Card variant="gradient" className="flex h-[640px] flex-col p-5 sm:p-6">
            <div className="mb-5 flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl p-4 sm:max-w-xl lg:max-w-2xl ${
                      msg.role === 'user'
                        ? 'bg-white text-black'
                        : 'border border-[#2e303a] bg-[#11131d] text-[#F7F7F7]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{msg.content}</p>
                    {msg.meta ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.15em] text-gray-400">{msg.meta}</p>
                    ) : null}
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="max-w-xs rounded-2xl border border-[#2e303a] bg-[#11131d] p-4 text-[#F7F7F7] lg:max-w-md">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#00FF88]"></span>
                      Coach is thinking...
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#2e303a] pt-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about fitness..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button
                  variant="primary"
                  onClick={() => void handleSendMessage()}
                  disabled={!message.trim()}
                  isLoading={isSending}
                  className="sm:self-end"
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};
