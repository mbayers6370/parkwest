import { NextResponse } from "next/server";
import { getAdminModuleLabel, getAdminModuleOption } from "@/lib/admin-modules";
import { ADMIN_PROPERTY_SESSION_COOKIE } from "@/lib/admin-session";
import type { AdminPropertySession } from "@/lib/property-access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AdminPropertySession>;

    if (!body.propertyKey || !body.propertyName || !body.roleKey || !body.employeeRecordId) {
      return NextResponse.json({ error: "A property-scoped admin session is required." }, { status: 400 });
    }

    const moduleOption = getAdminModuleOption(body.moduleKey);
    const session: AdminPropertySession = {
      employeeRecordId: body.employeeRecordId,
      employeeId: body.employeeId ?? "",
      displayName: body.displayName ?? "",
      roleKey: body.roleKey,
      propertyKey: body.propertyKey,
      propertyName: body.propertyName,
      moduleKey: moduleOption.key,
      moduleLabel: body.moduleLabel?.trim() || getAdminModuleLabel(moduleOption.key),
    };

    const response = NextResponse.json({ ok: true, session });
    response.cookies.set(ADMIN_PROPERTY_SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Admin session could not be updated." },
      { status: 500 },
    );
  }
}
