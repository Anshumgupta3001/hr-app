import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import AccountMenu from './AccountMenu';
import NotificationBell from './NotificationBell';
import UpcomingEventsWidget from './UpcomingEventsWidget';
import { theme, APP_NAME } from '../theme';

export default function NavBar({ user, company = null, companyId = null, navigation }) {
  const isSuper = user.role === 'superadmin';
  const showBell = !isSuper;
  const showEvents = Boolean(companyId);

  function openDrawer() {
    const parent = navigation.getParent();
    if (parent) parent.openDrawer();
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={openDrawer} style={styles.menuButton} accessibilityLabel="Open menu">
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.ink}
          strokeWidth={2}
          strokeLinecap="round"
        >
          <Path d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
      </Pressable>
      <View style={styles.logoTile}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Rect x={0} y={0} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={8} y={0} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={0} y={8} width={6} height={6} rx={1} fill={theme.colors.white} />
          <Rect x={8} y={8} width={6} height={6} rx={1} fill={theme.colors.white} />
        </Svg>
      </View>
      <Text style={styles.wordmark}>{APP_NAME}</Text>
      <View style={styles.right}>
        {company && (
          <View style={styles.companyPill}>
            <Text style={styles.companyPillText} numberOfLines={1}>
              {company.name}
            </Text>
          </View>
        )}
        {showEvents && (
          <UpcomingEventsWidget companyId={companyId} user={user} navigation={navigation} />
        )}
        {showBell && (
          <NotificationBell user={user} companyId={companyId} navigation={navigation} />
        )}
        <AccountMenu user={user} navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...theme.clayShadow,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadowButton,
  },
  logoTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.icon,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadowButton,
  },
  wordmark: {
    fontFamily: theme.fonts.displayBlack,
    fontSize: 20,
    color: theme.colors.ink,
  },
  right: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  companyPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.violet,
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: 130,
  },
  companyPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.white,
  },
});
