import { SignedIn, SignedOut } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { View } from "react-native";

export default function Index() {
  return (
    <View>
      <SignedIn>
        <Redirect href="/(home)" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/(auth)/sign-in" />
      </SignedOut>
    </View>
  );
}
