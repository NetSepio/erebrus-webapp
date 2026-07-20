/** Sign in with Apple JS — https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js */
export {};

type AppleAuthConfig = {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  nonce?: string;
  responseType?: "code" | "id_token" | "code id_token";
  responseMode?: "query" | "fragment" | "form_post";
  usePopup?: boolean;
};

type AppleSignInResponse = {
  authorization: {
    id_token: string;
    code?: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
};

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: AppleAuthConfig) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}