import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await fetch(`${API_BASE}/api/v1/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`PATCH /api/v1/alerts/${(await params).id} error:`, error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${API_BASE}/api/v1/alerts/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/v1/alerts/${(await params).id} error:`, error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
