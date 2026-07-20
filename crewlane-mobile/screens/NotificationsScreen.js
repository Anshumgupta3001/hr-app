import { useCallback, useState } from 'react';
import { Text, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import BackButton from '../components/BackButton';
import Avatar from '../components/Avatar';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { theme } from '../theme';

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen({ navigation, route }) {
  const companyId = route.params?.companyId ?? null;
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const isAdminView =
          current.role === 'admin' || (current.role === 'superadmin' && companyId);
        let list;
        if (isAdminView) {
          const targetCompanyId =
            current.role === 'admin' ? current.companyId : companyId;
          list = await notificationService.getAdminNotifications(targetCompanyId);
        } else {
          list = await notificationService.getEmployeeNotifications(current.id);
        }
        if (!active) return;
        setUser(current);
        setNotifications(list);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, companyId])
  );

  if (!user) {
    return <SafeAreaView style={styles.screen} />;
  }

  async function handleSelect(notification) {
    await notificationService.markRead(notification.id);
    const params = { companyId: notification.companyId };
    const screens = {
      praise_received: 'PraiseWall',
      announcement_posted: 'CompanyFeed',
      expense_submitted: 'ExpenseClaims',
      expense_decided: 'MyExpenses',
      resignation_submitted: 'Resignations',
      resignation_acknowledged: 'Dashboard',
    };
    if (screens[notification.type]) {
      navigation.navigate(screens[notification.type], params);
    } else if (notification.audience === 'admin') {
      navigation.navigate('LeaveRequests', params);
    } else {
      navigation.navigate('MyLeave', params);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Notifications</Text>
        {notifications.length === 0 ? (
          <Text style={styles.empty}>No notifications yet.</Text>
        ) : (
          <OutlinedCard contentStyle={styles.listContent}>
            {notifications.map((n, i) => (
              <Pressable
                key={n.id}
                onPress={() => handleSelect(n)}
                style={[styles.item, i > 0 && styles.itemBorder]}
              >
                {n.targetEmployeeId && (
                  <Avatar employeeId={n.targetEmployeeId} name="" size={32} />
                )}
                <View style={styles.itemText}>
                  <Text style={[styles.message, n.isRead && styles.messageRead]}>
                    {n.message}
                  </Text>
                  <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                </View>
              </Pressable>
            ))}
          </OutlinedCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  back: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.teal,
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 18,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  listContent: {
    padding: 0,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  itemBorder: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(51,47,58,0.08)',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    lineHeight: 19,
  },
  messageRead: {
    fontFamily: theme.fonts.body,
    opacity: 0.6,
  },
  time: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.ink,
    opacity: 0.4,
    marginTop: 4,
  },
});
