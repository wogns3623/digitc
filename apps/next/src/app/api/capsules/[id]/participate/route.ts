// 타임캡슐에 참여하기 위한 keypair 발급 api

import { NextRequest, NextResponse } from "next/server";

import { generateKeyPair } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const keypair = await generateKeyPair();

  return new NextResponse(JSON.stringify({ keypair }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
