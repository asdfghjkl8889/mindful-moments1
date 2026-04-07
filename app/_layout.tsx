import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth" || segments[0] === "welcome";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="inspiration"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="game/[type]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="emergency"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="challenges"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="course-week"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="negative-thoughts"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="games"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mood-garden"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="quick-calm"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="overthinking"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="anger-management"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="circadian"
          options={{ headerShown: false }}
        />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
