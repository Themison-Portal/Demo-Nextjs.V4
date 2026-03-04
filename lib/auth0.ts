import { Auth0Client } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client | null = null;

export function getAuth0Client() {
    if (!auth0Client) {
        auth0Client = new Auth0Client({
            domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
            clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
            authorizationParams: {
                audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
                redirect_uri: window.location.origin,
            },
        });
    }

    return auth0Client;
}