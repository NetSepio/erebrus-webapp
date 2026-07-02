/** Google Identity Services (GIS) — https://developers.google.com/identity/gsi/web */
export {};

type GoogleCredentialCallback = (response: { credential?: string; select_by?: string }) => void;

type GoogleIdConfiguration = {
  client_id: string;
  callback: GoogleCredentialCallback;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
  ux_mode?: "popup" | "redirect";
};

type GsiButtonConfiguration = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
          prompt: (momentListener?: (notification: Record<string, () => boolean>) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}