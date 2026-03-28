import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

// 获取收藏列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const url = userId
      ? `${API_BASE}/api/v1/favorites?user_id=${userId}`
      : `${API_BASE}/api/v1/favorites`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// 添加收藏
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/api/v1/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// 删除收藏
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get("id");
    if (!favoriteId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const res = await fetch(`${API_BASE}/api/v1/favorites/${favoriteId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
  }
}
