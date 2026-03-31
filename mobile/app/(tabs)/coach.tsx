import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

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
  createdAt: string;
};

const starterPrompts = [
  'I missed two workouts this week. How should I adjust?',
  'Give me a simple fat-loss meal structure for a workday.',
  'My recovery has been slow lately. What should I change first?',
];

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TypingIndicator() {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View style={[styles.typingWrap, { opacity }]}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </Animated.View>
  );
}

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
          createdAt: interaction.createdAt,
        });
      }

      if (interaction.outputText.trim()) {
        historyMessages.push({
          id: `${interaction.id}-assistant`,
          role: 'assistant',
          content: interaction.outputText.trim(),
          meta: `${interaction.provider} | ${interaction.model}`,
          createdAt: interaction.createdAt,
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
      createdAt: new Date().toISOString(),
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
        createdAt: response.data.generatedAt,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      const fallbackMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'I hit a temporary issue while generating a reply. Please try again in a moment.',
        createdAt: new Date().toISOString(),
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
    <AppShell>
      <KeyboardAvoidingView
        style={styles.layout}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topSection}>
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
                  setMessage('');
                }}
              >
                New chat
              </AppButton>
            </View>

            {!hasPremiumAccess ? (
              <View style={styles.gateCard}>
                <AppText style={styles.gateTitle}>AI replies are a premium feature</AppText>
                <AppText tone="muted">
                  The coach tab is live on mobile. Upgrade this account to unlock real reply generation, saved history, and weekly adjustment help.
                </AppText>
                <AppButton variant="secondary" onPress={() => router.push('/billing' as never)}>
                  Unlock premium
                </AppButton>
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
        </View>

        <Panel style={styles.chatPanel}>
          <AppText style={styles.title}>Conversation</AppText>
          <ScrollView
            ref={scrollRef}
            nestedScrollEnabled
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
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
              <View style={styles.messageMetaRow}>
                {entry.meta ? (
                  <AppText tone="muted" style={styles.meta}>
                    {entry.meta}
                  </AppText>
                ) : <View />}
                <AppText tone="muted" style={styles.meta}>
                  {formatMessageTime(entry.createdAt)}
                </AppText>
              </View>
            </View>
          ))}

          {isSending ? (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <TypingIndicator />
              <AppText tone="muted">Coach is thinking...</AppText>
            </View>
          ) : null}
        </ScrollView>
      </Panel>

      <Panel style={styles.composerPanel}>
        <AppText style={styles.title}>Ask the coach</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptRow}
          keyboardShouldPersistTaps="handled"
        >
          {starterPrompts.map((prompt) => (
            <Pressable key={`composer-${prompt}`} onPress={() => setMessage(prompt)} style={styles.quickPromptChip}>
              <AppText style={styles.quickPromptText}>{prompt}</AppText>
            </Pressable>
          ))}
        </ScrollView>
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
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: 14,
  },
  topSection: {
    gap: 14,
  },
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
  chatPanel: {
    minHeight: 220,
  },
  chatScroll: {
    maxHeight: 360,
  },
  chatContent: {
    gap: 12,
    paddingBottom: 6,
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
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
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
    minHeight: 112,
    maxHeight: 160,
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
  composerPanel: {
    paddingBottom: 18,
  },
  quickPromptRow: {
    gap: 10,
    paddingBottom: 2,
  },
  quickPromptChip: {
    maxWidth: 240,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickPromptText: {
    fontSize: 13,
    lineHeight: 18,
  },
  typingWrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#9CCBFF',
  },
});
