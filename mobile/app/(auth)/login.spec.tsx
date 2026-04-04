import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import LoginScreen from './login';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const mockReplace = jest.fn();
const mockShowToast = jest.fn();
const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: {
    replace: mockReplace,
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => {
    const { View: MockView } = require('react-native');
    return <MockView>{children}</MockView>;
  },
}));

jest.mock('@/components/Panel', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => {
    const { View: MockView } = require('react-native');
    return <MockView>{children}</MockView>;
  },
}));

jest.mock('@/components/SectionHeader', () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle: string }) => {
    const { View: MockView, Text: MockText } = require('react-native');
    return (
      <MockView>
        <MockText>{title}</MockText>
        <MockText>{subtitle}</MockText>
      </MockView>
    );
  },
}));

jest.mock('@/components/AppText', () => ({
  AppText: ({ children }: { children: React.ReactNode }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{children}</MockText>;
  },
}));

jest.mock('@/components/AppInput', () => ({
  AppInput: ({
    label,
    value,
    onChangeText,
    secureTextEntry,
  }: {
    label: string;
    value?: string;
    onChangeText?: (value: string) => void;
    secureTextEntry?: boolean;
  }) => {
    const { TextInput: MockTextInput } = require('react-native');
    return (
      <MockTextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    );
  },
}));

jest.mock('@/components/AppButton', () => ({
  AppButton: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => {
    const { Text: MockText } = require('react-native');
    return <MockText onPress={onPress}>{children}</MockText>;
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseToast = jest.mocked(useToast);

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    } as ReturnType<typeof useAuth>);
    mockedUseToast.mockReturnValue({
      showToast: mockShowToast,
      hideToast: jest.fn(),
    });
  });

  it('logs in with a trimmed email and routes to the dashboard on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), ' demo@fitnova.ai ');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('demo@fitnova.ai', 'secret');
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });

  it('shows a danger toast when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'demo@fitnova.ai');
    fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Login failed',
        message: 'Check your credentials and try again.',
        tone: 'danger',
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
