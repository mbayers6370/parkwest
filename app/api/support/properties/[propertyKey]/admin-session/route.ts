import { NextResponse } from "next/server";
import {
  ADMIN_PROPERTY_SESSION_COOKIE,
} from "@/lib/admin-session";
import type { AdminPropertySession } from "@/lib/property-access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminPropertySession;

    if (!body.propertyKey || !body.propertyName || !body.roleKey || !body.employeeRecordId) {
      return NextResponse.json({ error: "A property-scoped admin session is required." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_PROPERTY_SESSION_COOKIE, JSON.stringify(body), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Admin session could not be started." },
      { status: 500 },
    );
  }
}
