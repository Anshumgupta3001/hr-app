import { useCallback, useState } from 'react';
import { Text, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import BackButton from '../components/BackButton';
import { computeUpcomingEvents } from '../components/UpcomingEventsWidget';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { holidayService } from '../services/holidayService';
import { theme } from '../theme';

const TYPE_COLORS = {
  holiday: theme.colors.mustard,
  birthday: theme.colors.coral,
  anniversary: theme.colors.violet,
  probation: theme.colors.sky,
};

function formatDaysUntil(daysUntil) {
  return daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

export default function UpcomingEventsScreen({ navigation, route }) {
  const companyId = route.params?.companyId;
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [current, holidays, employees] = await Promise.all([
          authService.getCurrentUser(),
          holidayService.getHolidaysByCompany(companyId),
          employeeService.getEmployeesByCompany(companyId),
        ]);
        if (!active) return;
        const includeProbation = Boolean(
          current && ['admin', 'hr'].includes(current.role)
        );
        setEvents(computeUpcomingEvents(holidays, employees, new Date(), { includeProbation }));
        setLoaded(true);
      }
      load();
      return () => {
        active = false;
      };
    }, [companyId])
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Upcoming (next 15 days)</Text>
        {loaded && events.length === 0 ? (
          <Text style={styles.empty}>Nothing coming up.</Text>
        ) : (
          <OutlinedCard contentStyle={styles.listContent}>
            {events.map((event, i) => (
              <View key={event.id} style={[styles.item, i > 0 && styles.itemBorder]}>
                <View style={styles.itemTop}>
                  <View style={[styles.badge, { backgroundColor: TYPE_COLORS[event.type] }]}>
                    <Text style={styles.badgeText}>{event.label}</Text>
                  </View>
                  <Text style={styles.daysUntil}>{formatDaysUntil(event.daysUntil)}</Text>
                </View>
                <Text style={styles.name}>{event.name}</Text>
                <Text style={styles.date}>
                  {event.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </Text>
              </View>
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
    fontSize: 26,
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
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.08)',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  daysUntil: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.muted,
  },
  name: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
    marginTop: 8,
  },
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
