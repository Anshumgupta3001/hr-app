import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import MarkerHighlight from '../components/MarkerHighlight';
import { authService } from '../services/authService';
import { theme, APP_NAME } from '../theme';

function LogoMark() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoTile}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Rect x={0} y={0} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={8} y={0} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={0} y={8} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={8} y={8} width={6} height={6} rx={1} fill={theme.colors.white} />
        </Svg>
      </View>
      <Text style={styles.wordmark}>{APP_NAME}</Text>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    try {
      const user = await authService.login(email, password);
      if (user.role === 'superadmin') {
        navigation.reset({ index: 0, routes: [{ name: 'SuperAdminDashboard' }] });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard', params: { companyId: user.companyId } }],
        });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ConfettiBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <LogoMark />
          <View style={styles.taglineRow}>
            <Text style={styles.tagline}>Run your people ops with </Text>
            <MarkerHighlight textStyle={styles.tagline}>real discipline</MarkerHighlight>
            <Text style={styles.tagline}>.</Text>
          </View>
          <Text style={styles.description}>
            Attendance, leave, payroll, and your entire org, in one structured system
            instead of five scattered tools.
          </Text>
          <OutlinedCard style={styles.cardWrap}>
            <Text style={styles.heading}>Log in</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <CandyButton
              title="Log in"
              variant="primary"
              onPress={handleLogin}
              style={styles.submit}
            />
            <Text style={styles.muted}>Forgot your password? Contact your admin.</Text>
          </OutlinedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.icon,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadowButton,
  },
  wordmark: {
    fontFamily: theme.fonts.displayBlack,
    fontSize: 26,
    color: theme.colors.ink,
  },
  taglineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  tagline: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: theme.colors.ink,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.ink,
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: 380,
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  cardWrap: {
    width: '100%',
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 18,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 6,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  submit: {
    marginTop: 4,
  },
  muted: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 16,
  },
});
