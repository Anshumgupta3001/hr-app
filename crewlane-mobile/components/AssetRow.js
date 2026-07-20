import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { theme } from '../theme';

const STATUS_COLORS = {
  available: theme.colors.teal,
  assigned: theme.colors.violet,
};

export default function AssetRow({ asset, assignedName = null, needsReturn = false, actions = null, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.name}>
            {asset.name} <Text style={styles.type}>· {asset.assetType}</Text>
          </Text>
          <Text style={styles.serial}>S/N: {asset.serialNumber || '—'}</Text>
          {assignedName ? (
            <Text style={styles.assignee}>Assigned to {assignedName}</Text>
          ) : null}
        </View>
        <View style={styles.badges}>
          {needsReturn && (
            <View style={[styles.badge, { backgroundColor: theme.colors.mustard }]}>
              <Text style={styles.badgeText}>Needs Return</Text>
            </View>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: STATUS_COLORS[asset.status] || theme.colors.inputFill },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                !STATUS_COLORS[asset.status] && { color: theme.colors.muted },
              ]}
            >
              {asset.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  type: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.muted,
  },
  serial: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
  },
  assignee: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
    marginTop: 4,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
    color: theme.colors.white,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
