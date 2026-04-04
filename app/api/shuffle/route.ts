import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/shuffle?n=N
 *
 * Returns a true-random zero-based permutation of length N, sourced from
 * random.org's sequences API. Falls back to a server-side Fisher-Yates
 * shuffle (using Math.random) if random.org is unavailable.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("n");
  const n   = Number(raw);

  if (!Number.isInteger(n) || n < 1 || n > 1000) {
    return NextResponse.json({ error: "n must be an integer 1–1000" }, { status: 400 });
  }

  // Single item — nothing to shuffle
  if (n === 1) {
    return NextResponse.json({ order: [0], source: "trivial" });
  }

  try {
    // random.org sequences: returns a permutation of min..max, one per line
    const url =
      `https://www.random.org/sequences/?min=0&max=${n - 1}&col=1&format=plain&rnd=new`;

    const res = await fetch(url, {
      cache: "no-store",
      // Give it 4 s before we fall back
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`random.org responded ${res.status}`);

    const text  = await res.text();
    const order = text.trim().split("\n").map(Number);

    if (order.length !== n || order.some(isNaN)) {
      throw new Error("Unexpected random.org payload");
    }

    return NextResponse.json({ order, source: "random.org" });

  } catch {
    // Server-side Fisher-Yates — still better than client-side Math.random
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return NextResponse.json({ order, source: "fallback" });
  }
}
