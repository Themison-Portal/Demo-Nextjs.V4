import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { token } = await req.json();

    if (!token) {
        return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });

    // ✅ Set as httpOnly cookie — server sets it, so it's in the NEXT request
    response.cookies.set("access_token", token, {
        httpOnly: false,   // keep false so client apiClient can still read it if needed
        path: "/",
        maxAge: 60 * 60,  // 1 hour
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    return response;
}