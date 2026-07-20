import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { notificationService } from '../services/notificationService';
import { theme } from '../theme';

export default function NotificationBell({ user, companyId = null, navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdminView =
    user.role === 'admin' || (user.role === 'superadmin' && companyId);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        let notifications;
        if (isAdminView) {
          const targetCompanyId = user.role === 'admin' ? user.companyId : companyId;
          notifications = await notificationService.getAdminNotifications(targetCompanyId);
        } else {
          notifications = await notificationService.getEmployeeNotifications(user.id);
        }
        if (active) {
          setUnreadCount(notifications.filter((n) => !n.isRead).length);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [isAdminView, user, companyId])
  );

  return (
    <Pressable
      onPress={() => navigation.navigate('Notifications', { companyId })}
      style={styles.button}
      accessibilityLabel="Notifications"
    >
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M12 3c-3.1 0-5.2 2.3-5.2 5.2v3.1L5 14.6h14l-1.8-3.3V8.2C17.2 5.3 15.1 3 12 3Z" />
        <Path d="M10.3 17.5a1.8 1.8 0 0 0 3.4 0" />
      </Svg>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadowButton,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
});
