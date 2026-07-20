import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
import { employeeService } from '../services/employeeService';
import { holidayService } from '../services/holidayService';
import { theme } from '../theme';

const WINDOW_DAYS = 15;

function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(target, today) {
  return Math.round((startOfDay(target) - startOfDay(today)) / 86400000);
}

function nextOccurrence(isoDateString, today) {
  const source = new Date(`${isoDateString}T00:00:00`);
  let candidate = new Date(today.getFullYear(), source.getMonth(), source.getDate());
  if (daysBetween(candidate, today) < 0) {
    candidate = new Date(today.getFullYear() + 1, source.getMonth(), source.getDate());
  }
  return candidate;
}

export function computeUpcomingEvents(
  holidays,
  employees,
  today = new Date(),
  { includeProbation = false } = {}
) {
  const events = [];

  for (const holiday of holidays) {
    const target = new Date(`${holiday.date}T00:00:00`);
    const daysUntil = daysBetween(target, today);
    if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
      events.push({
        id: `holiday-${holiday.id}`,
        type: 'holiday',
        label: 'Holiday',
        name: holiday.name,
        date: target,
        daysUntil,
      });
    }
  }

  for (const employee of employees) {
    if (employee.dateOfBirth) {
      const occurrence = nextOccurrence(employee.dateOfBirth, today);
      const daysUntil = daysBetween(occurrence, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        events.push({
          id: `birthday-${employee.id}`,
          type: 'birthday',
          label: 'Birthday',
          name: employee.name,
          date: occurrence,
          daysUntil,
        });
      }
    }
    if (employee.dateOfJoining) {
      const occurrence = nextOccurrence(employee.dateOfJoining, today);
      const daysUntil = daysBetween(occurrence, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        const joiningYear = new Date(`${employee.dateOfJoining}T00:00:00`).getFullYear();
        const anniversaryNumber = occurrence.getFullYear() - joiningYear;
        if (anniversaryNumber > 0) {
          events.push({
            id: `anniversary-${employee.id}`,
            type: 'anniversary',
            label: `${ordinal(anniversaryNumber)} work anniversary`,
            name: employee.name,
            date: occurrence,
            daysUntil,
          });
        }
      }
    }
    if (includeProbation && employee.probationEndDate) {
      const target = new Date(`${employee.probationEndDate}T00:00:00`);
      const daysUntil = daysBetween(target, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        events.push({
          id: `probation-${employee.id}`,
          type: 'probation',
          label: 'Probation Ending',
          name: employee.name,
          date: target,
          daysUntil,
        });
      }
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

export default function UpcomingEventsWidget({ companyId, user = null, navigation }) {
  const [count, setCount] = useState(0);

  const includeProbation = Boolean(user && ['admin', 'hr'].includes(user.role));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        if (!companyId) return;
        const [holidays, employees] = await Promise.all([
          holidayService.getHolidaysByCompany(companyId),
          employeeService.getEmployeesByCompany(companyId),
        ]);
        if (!active) return;
        setCount(
          computeUpcomingEvents(holidays, employees, new Date(), { includeProbation }).length
        );
      }
      load();
      return () => {
        active = false;
      };
    }, [companyId, includeProbation])
  );

  if (!companyId) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate('UpcomingEvents', { companyId })}
      style={styles.button}
      accessibilityLabel="Upcoming events"
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
        <Rect x={3} y={5} width={18} height={16} rx={2.5} />
        <Path d="M3 9.5h18" />
        <Path d="M8 2.5v4M16 2.5v4" />
        <Path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01" />
      </Svg>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
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
