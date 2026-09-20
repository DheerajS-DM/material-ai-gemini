import { NextResponse } from "next/server";
import materialsData from "@/data/materials_db.json";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    materials_count: materialsData.length,
    engine: "MaterialsAI Next.js API Engine v1.0",
  });
}
