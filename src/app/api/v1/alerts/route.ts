export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

async function proxyRequest(request: NextRequest, path: string, method: string) {
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${RAILWAY_URL}/api/v1/${path}${searchParams ? \`?\${searchParams}\` : ""}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(authHeader ? { "Authorization": authHeader } : {}),
    ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
  };

  try {
    let body: BodyInit | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const text = await request.text();
      if (text) body = text;
    }

    const res = await fetch(url, { method, headers, body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(\`\${method} /api/v1/\${path} error:\`, error);
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "alerts", "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "alerts", "POST");
}
