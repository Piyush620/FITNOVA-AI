import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { aiAPI } from '@/services/api';
import type { AiInteraction } from '@/types';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
};

const starterPrompts = [
  'I missed two workouts this week. How should I adjust?',
  'Give me a simple fat-loss meal structure for a workday.',
  'My recovery has been slow lately. What should I change first?',
];

function mapHistory(items: AiInteraction[]): ChatMessage[] {
  return items
    .slice()
    .reverse()
    .flatMap((interaction) => {
      const historyMessages: ChatMessage[] = [];
      const promptMessage = interaction.promptPayload?.message;

      if (typeof promptMessage === 'string' && promptMessage.trim()) {
        historyMessages.push({
          id: `${interaction.id}-user`,
          role: 'user',
          content: promptMessage.trim(),
        });
      }

      if (interaction.outputText.trim()) {
        historyMessages.push({
          id: `${interaction.id}-assistant`,
          role: 'assistant',
          content: interaction.outputText.trim(),
          meta: `${interaction.provider} | ${interaction.model}`,
        });
      }

      return historyMessages;
    });
}

export default function CoachScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (!hasPremiumAccess) {
        if (mounted) {
          setMessages([]);
          setIsHydrating(false);
        }
        return;
      }

      try {
        const response = await aiAPI.getHistory(1, 8, 'coach-chat');

        if (mounted) {
          setMessages(mapHistory(response.data.items));
        }
      } catch {
        if (mounted) {
          setMessages([]);
        }
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [hasPremiumAccess]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isSending]);

  const statusLabel = useMemo(() => {
    if (!hasPremiumAccess) {
      return 'Premium required';
    }

    return isSending ? 'Thinking' : 'Ready';
  }, [hasPremiumAccess, isSending]);

  const handleSend = async () => {
    const trimmed = message.trim();

    if (!hasPremiumAccess) {
      showToast({
        title: 'Premium required',
        message: 'Upgrade this account to unlock live AI coach replies on mobile.',
        tone: 'warning',
      });
      return;
    }

    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage('');
    setError(null);
    setIsSending(true);

    try {
      const response = await aiAPI.coachChat(trimmed);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        meta: `${response.data.provider} | ${response.data.model}`,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      const fallbackMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'I hit a temporary issue while generating a reply. Please try again in a moment.',
      };

      setMessages((current) => [...current, fallbackMessage]);
      setError('The coach could not respond right now.');
      showToast({
        title: 'Coach unavailable',
        message: 'The AI reply failed this time. Please try again in a moment.',
        tone: 'danger',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppShell scroll={false}>
      <SectionHeader
        eyebrow="AI Coach"
        title="Pocket coaching that actually feels live"
        subtitle="Real mobile chat, recent history, and fast prompts for the moments when you need direction now."
      />

      <Panel>
        <View style={styles.headerRow}>
          <View>
            <AppText style={styles.title}>Coach status</AppText>
            <AppText tone={hasPremiumAccess ? 'success' : 'muted'}>{statusLabel}</AppText>
          </View>
          <AppButton
            variant="secondary"
            onPress={() => {
              setMessages([]);
              setError(null);
            }}
          >
            Clear
          </AppButton>
        </View>

        {!hasPremiumAccess ? (
          <View style={styles.gateCard}>
            <AppText style={styles.gateTitle}>AI replies are a premium feature</AppText>
            <AppText tone="muted">
              The coach tab is live on mobile. Upgrade this account to unlock real reply generation, saved history, and weekly adjustment help.
            </AppText>
          </View>
        ) : null}

        <View style={styles.promptWrap}>
          {starterPrompts.map((prompt) => (
            <Pressable key={prompt} onPress={() => setMessage(prompt)} style={styles.promptChip}>
              <AppText style={styles.promptText}>{prompt}</AppText>
            </Pressable>
          ))}
        </View>
      </Panel>

      {error ? (
        <Panel>
          <AppText>{error}</AppText>
        </Panel>
      ) : null}

      <Panel>
        <AppText style={styles.title}>Conversation</AppText>
        <ScrollView ref={scrollRef} style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
          {isHydrating ? <AppText tone="muted">Loading recent coach context...</AppText> : null}

          {!messages.length && !isHydrating ? (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle}>Start with the thing blocking you most.</AppText>
              <AppText tone="muted">
                Ask about missed workouts, flat energy, slow recovery, or how to adjust this week.
              </AppText>
            </View>
          ) : null}

          {messages.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.messageBubble,
                entry.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <AppText style={entry.role === 'user' ? styles.userText : undefined}>{entry.content}</AppText>
              {entry.meta ? (
                <AppText tone="muted" style={styles.meta}>
                  {entry.meta}
                </AppText>
              ) : null}
            </View>
          ))}

          {isSending ? (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <AppText tone="muted">Coach is thinking...</AppText>
            </View>
          ) : null}
        </ScrollView>
      </Panel>

      <Panel>
        <AppText style={styles.title}>Ask the coach</AppText>
        <TextInput
          multiline
          value={message}
          onChangeText={setMessage}
          style={[styles.input, styles.textarea]}
          placeholder="Ask about training, recovery, nutrition, or how to adjust your week..."
          placeholderTextColor="#96A0B8"
          textAlignVertical="top"
        />
        <AppText tone="muted" style={styles.helperText}>
          Best results come from specific asks like missed sessions, low energy, slow recovery, or what to eat around training.
        </AppText>
        <AppButton onPress={() => void handleSend()} loading={isSending}>
          Send message
        </AppButton>
      </Panel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  promptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptChip: {
    borderWidth: 1,
    borderColor: 'rgba(53,208,255,0.16)',
    backgroundColor: 'rgba(53,208,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatScroll: {
    maxHeight: 360,
  },
  chatContent: {
    gap: 12,
  },
  emptyState: {
    gap: 8,
    paddingVertical: 6,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  userBubble: {
    backgroundColor: '#EAF4FF',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  userText: {
    color: '#0B1320',
  },
  meta: {
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F6F7FB',
    paddingHorizontal: 14,
  },
  textarea: {
    minHeight: 140,
    paddingTop: 14,
  },
  gateCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,184,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.2)',
    padding: 14,
    gap: 6,
  },
  gateTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
