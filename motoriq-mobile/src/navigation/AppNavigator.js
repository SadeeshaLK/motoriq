import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ThemeProvider } from "../context/ThemeContext";
import LoginScreen        from "../screens/LoginScreen";
import HomeScreen         from "../screens/HomeScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import InboxScreen        from "../screens/InboxScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login"         component={LoginScreen} />
          <Stack.Screen name="Home"          component={HomeScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Inbox"         component={InboxScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}