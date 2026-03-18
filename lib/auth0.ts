import { Auth0Client } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client | null = null;

// ✅ Add export here
export function getAuth0Client() {
    if (typeof window === "undefined") {
        throw new Error("Auth0Client can only be created in the browser");
    }

    if (!auth0Client) {
        auth0Client = new Auth0Client({
            domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
            clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
            authorizationParams: {
                audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
                redirect_uri: window.location.origin + "/auth/callback",
                scope: "openid profile email",
            },
        });
    }

    return auth0Client;
}