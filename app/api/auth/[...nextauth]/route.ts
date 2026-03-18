import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

const handler = NextAuth({
    providers: [
        Auth0Provider({
            clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
            clientSecret: process.env.AUTH0_CLIENT_SECRET!,
            issuer: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/signin", // your custom sign-in page
        error: "/signin",  // redirect here on errors
    },
});

export { handler as GET, handler as POST };