import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { authService } from '../services/authService';
import { theme } from '../theme';

export default function AccountMenu({ user, navigation }) {
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await authService.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  function handleChangePassword() {
    setOpen(false);
    navigation.navigate('ChangePassword');
  }

  function handleMyProfile() {
    setOpen(false);
    navigation.navigate('MyProfile');
  }

  function handleResign() {
    setOpen(false);
    navigation.navigate('Resign');
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.avatarButton}
        accessibilityLabel="Account menu"
      >
        <Avatar employeeId={user.id} name={user.name} size={40} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.menuEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <Pressable style={styles.menuItem} onPress={handleMyProfile}>
              <Text style={styles.menuItemText}>My Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleChangePassword}>
              <Text style={styles.menuItemText}>Change Password</Text>
            </Pressable>
            {user.role !== 'superadmin' && (
              <Pressable style={styles.menuItem} onPress={handleResign}>
                <Text style={styles.menuItemText}>Resign</Text>
              </Pressable>
            )}
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, { color: theme.colors.coral }]}>Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    borderRadius: 20,
    ...theme.clayShadowButton,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23,20,13,0.25)',
    alignItems: 'flex-end',
  },
  menu: {
    marginTop: 96,
    marginRight: 16,
    minWidth: 200,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.button,
    overflow: 'hidden',
    ...theme.clayShadow,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,47,58,0.08)',
  },
  menuName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  menuEmail: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
});
