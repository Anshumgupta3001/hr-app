import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { theme } from '../theme';

export default function CurrentlyInWidget({ records = [], employees = [] }) {
  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  return (
    <OutlinedCard>
      <Text style={styles.heading}>Who's In Right Now</Text>
      {records.length === 0 ? (
        <Text style={styles.empty}>No one is currently clocked in.</Text>
      ) : (
        <View style={styles.list}>
          {records.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.name}>{employeeName(r.employeeId)}</Text>
              <Text style={styles.time}>
                {new Date(r.clockInTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.inputFill,
    borderRadius: theme.radius.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  name: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  time: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
  },
});
