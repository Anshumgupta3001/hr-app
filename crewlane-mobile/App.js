import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import LoginScreen from './screens/LoginScreen';
import SuperAdminDashboardScreen from './screens/SuperAdminDashboardScreen';
import CreateCompanyScreen from './screens/CreateCompanyScreen';
import EditCompanyScreen from './screens/EditCompanyScreen';
import DashboardScreen from './screens/DashboardScreen';
import EmployeesScreen from './screens/EmployeesScreen';
import EmployeeFormScreen from './screens/EmployeeFormScreen';
import CompanySettingsScreen from './screens/CompanySettingsScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import MyLeaveScreen from './screens/MyLeaveScreen';
import ApplyForLeaveScreen from './screens/ApplyForLeaveScreen';
import LeaveRequestsScreen from './screens/LeaveRequestsScreen';
import LeavePolicyScreen from './screens/LeavePolicyScreen';
import DefaultLeavePolicyScreen from './screens/DefaultLeavePolicyScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import HolidayCalendarScreen from './screens/HolidayCalendarScreen';
import UpcomingEventsScreen from './screens/UpcomingEventsScreen';
import PraiseWallScreen from './screens/PraiseWallScreen';
import MyDepartmentScreen from './screens/MyDepartmentScreen';
import MyExpensesScreen from './screens/MyExpensesScreen';
import SubmitExpenseScreen from './screens/SubmitExpenseScreen';
import ExpenseClaimsScreen from './screens/ExpenseClaimsScreen';
import CompanyFeedScreen from './screens/CompanyFeedScreen';
import OrgChartScreen from './screens/OrgChartScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import TeamReviewsScreen from './screens/TeamReviewsScreen';
import ReviewCyclesScreen from './screens/ReviewCyclesScreen';
import EmployeeChecklistScreen from './screens/EmployeeChecklistScreen';
import EmployeeDocumentsScreen from './screens/EmployeeDocumentsScreen';
import MyDocumentsScreen from './screens/MyDocumentsScreen';
import DocumentCenterScreen from './screens/DocumentCenterScreen';
import AssetInventoryScreen from './screens/AssetInventoryScreen';
import MyAssetsScreen from './screens/MyAssetsScreen';
import ResignationsScreen from './screens/ResignationsScreen';
import ResignScreen from './screens/ResignScreen';
import DrawerContent from './components/DrawerContent';
import { authService } from './services/authService';
import { theme } from './theme';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function RootStack({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.cream },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
      <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
      <Stack.Screen name="EditCompany" component={EditCompanyScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Employees" component={EmployeesScreen} />
      <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
      <Stack.Screen name="MyLeave" component={MyLeaveScreen} />
      <Stack.Screen name="ApplyForLeave" component={ApplyForLeaveScreen} />
      <Stack.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
      <Stack.Screen name="LeavePolicy" component={LeavePolicyScreen} />
      <Stack.Screen name="DefaultLeavePolicy" component={DefaultLeavePolicyScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="HolidayCalendar" component={HolidayCalendarScreen} />
      <Stack.Screen name="UpcomingEvents" component={UpcomingEventsScreen} />
      <Stack.Screen name="PraiseWall" component={PraiseWallScreen} />
      <Stack.Screen name="MyDepartment" component={MyDepartmentScreen} />
      <Stack.Screen name="MyExpenses" component={MyExpensesScreen} />
      <Stack.Screen name="SubmitExpense" component={SubmitExpenseScreen} />
      <Stack.Screen name="ExpenseClaims" component={ExpenseClaimsScreen} />
      <Stack.Screen name="CompanyFeed" component={CompanyFeedScreen} />
      <Stack.Screen name="OrgChart" component={OrgChartScreen} />
      <Stack.Screen name="Performance" component={PerformanceScreen} />
      <Stack.Screen name="TeamReviews" component={TeamReviewsScreen} />
      <Stack.Screen name="ReviewCycles" component={ReviewCyclesScreen} />
      <Stack.Screen name="EmployeeChecklist" component={EmployeeChecklistScreen} />
      <Stack.Screen name="EmployeeDocuments" component={EmployeeDocumentsScreen} />
      <Stack.Screen name="MyDocuments" component={MyDocumentsScreen} />
      <Stack.Screen name="DocumentCenter" component={DocumentCenterScreen} />
      <Stack.Screen name="AssetInventory" component={AssetInventoryScreen} />
      <Stack.Screen name="MyAssets" component={MyAssetsScreen} />
      <Stack.Screen name="Resignations" component={ResignationsScreen} />
      <Stack.Screen name="Resign" component={ResignScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function boot() {
      const user = await authService.getCurrentUser();
      if (!user) {
        setInitialRoute('Login');
      } else if (user.role === 'superadmin') {
        setInitialRoute('SuperAdminDashboard');
      } else {
        setInitialRoute('Dashboard');
      }
    }
    boot();
  }, []);

  if (!fontsLoaded || !initialRoute) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" backgroundColor={theme.colors.cream} />
          <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
              headerShown: false,
              drawerType: 'front',
              overlayColor: 'rgba(51,47,58,0.3)',
              drawerStyle: {
                width: 288,
                backgroundColor: 'transparent',
              },
            }}
          >
            <Drawer.Screen name="Root">
              {() => <RootStack initialRouteName={initialRoute} />}
            </Drawer.Screen>
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
