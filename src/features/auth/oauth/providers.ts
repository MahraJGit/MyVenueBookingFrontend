export type OAuthProviderId = "google" | "facebook" | "apple";

export type OAuthProviderConfig = {
  id: OAuthProviderId;
  labelKey: "socialGoogle" | "socialFacebook" | "socialApple";
  icon: string;
  enabled: boolean;
};

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: "google",
    labelKey: "socialGoogle",
    icon: "/images/google.png",
    enabled: true,
  },
  {
    id: "facebook",
    labelKey: "socialFacebook",
    icon: "/images/facebook.png",
    enabled: false,
  },
  {
    id: "apple",
    labelKey: "socialApple",
    icon: "/images/apple.png",
    enabled: false,
  },
];
