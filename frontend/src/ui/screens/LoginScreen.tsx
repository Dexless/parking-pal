import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import { login, register } from '../../api/api';
import { useAuth } from '../AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { setLoggedIn, setUserId } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !isLoading;
  }, [email, password, isLoading]);

  async function onLogin() {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      setLoggedIn(true);
      setUserId(result.user.id);
      setSuccess(`Logged in as ${result.user.email ?? 'user'}.`);
      setTimeout(() => navigation.goBack(), 600);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected login error.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister() {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await register(email.trim(), password);
      setSuccess('Registered. Check your email for confirmation, then log in.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected register error.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Sign in with your auth user account.</Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.loginBtn, !canSubmit && styles.loginBtnDisabled]}
            onPress={onLogin}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.registerBtn, !canSubmit && styles.loginBtnDisabled]}
            onPress={onRegister}
            disabled={!canSubmit}
          >
            <Text style={styles.loginBtnText}>Register</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    padding: 18,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3d3d3d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
  },
  loginBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flex: 1,
  },
  registerBtn: {
    backgroundColor: '#454545',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flex: 1,
  },
  buttonRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  loginBtnDisabled: {
    opacity: 0.55,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#f97373',
    marginBottom: 4,
  },
  success: {
    color: '#86efac',
    marginBottom: 4,
  },
});
