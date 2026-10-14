import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { AnimatedSplash } from "@/components/animated-splash";

import { useColors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { FavoritesProvider } from "@/hooks/use-favorites";
import {
  SettingsProvider,
  useResolvedColorScheme,
  useStrings,
} from "@/hooks/use-settings";
import { LocationProvider } from "@/hooks/use-user-location";

// The plain navy native splash stays until <AnimatedSplash> is on screen, so there's no flash between them.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <LocationProvider>
          <FavoritesProvider>
            <RootNavigator />
          </FavoritesProvider>
        </LocationProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

/** Split out so the theme hooks run inside <SettingsProvider>. */
function RootNavigator() {
  const scheme = useResolvedColorScheme();
  const c = useColors();
  const t = useStrings();
  const { user } = useAuth();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  // Navigation chrome (headers, sheets, transitions) uses the brand palette.
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.background,
      text: c.label,
      border: c.border,
      notification: c.primary,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="mechanic/[id]"
            options={{
              headerShown: false,
              presentation: "formSheet",
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.7, 1],
              sheetCornerRadius: 28,
              contentStyle: { backgroundColor: c.background },
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              title: t.advancedSearch,
              presentation: "modal",
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.background },
            }}
          />
          <Stack.Screen
            name="scan"
            options={{
              title: t.scanTitle,
              presentation: "fullScreenModal",
              headerTransparent: true,
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF" },
            }}
          />
          <Stack.Screen
            name="qr/[id]"
            options={{
              title: t.qrCode,
              presentation: "modal",
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.background },
            }}
          />
          <Stack.Screen
          name="edit-profile"
          options={{ title: t.editProfile, presentation: 'modal', headerShadowVisible: false, contentStyle: { backgroundColor: c.background } }}
        />
          <Stack.Screen
          name="sign-in"
            options={{
              title: t.signInTitle,
              presentation: "modal",
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.background },
            }}
          />
        </Stack>
        <AnimatedSplash ready={user !== undefined} />
      </View>
    </ThemeProvider>
  );
}
