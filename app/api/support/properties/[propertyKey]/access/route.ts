import { NextResponse } from "next/server";
import { getPropertyAccessEntries, grantPropertyAccess } from "@/lib/property-access";

export async function GET(
  _request: Request,
  context: { params: Promise<{ propertyKey: string }> },
) {
  try {
    const { propertyKey } = await context.params;
    const access = await getPropertyAccessEntries(propertyKey);
    return NextResponse.json({ access });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Property access failed to load." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyKey: string }> },
) {
  try {
    const { propertyKey } = await context.params;
    const body = (await request.json()) as {
      employeeRecordId?: string;
      roleKey?: string;
      moduleKey?: string;
    };

    if (!body.employeeRecordId || !body.roleKey) {
      return NextResponse.json(
        { error: "Employee and role are required." },
        { status: 400 },
      );
    }

    const access = await grantPropertyAccess({
      propertyKey,
      employeeRecordId: body.employeeRecordId,
      roleKey: body.roleKey,
      moduleKey: body.moduleKey,
    });

    return NextResponse.json({ access });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Property access could not be granted." },
      { status: 500 },
    );
  }
}
