import { NextResponse } from "next/server";
import { revokePropertyAccess } from "@/lib/property-access";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ propertyKey: string; assignmentId: string }> },
) {
  try {
    const { propertyKey, assignmentId } = await context.params;
    await revokePropertyAccess({ propertyKey, assignmentId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Property access could not be removed." },
      { status: 500 },
    );
  }
}
