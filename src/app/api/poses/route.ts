import { getDatabaseConnection } from "@/utils/database";
import { NextRequest } from "next/server";
import { Database } from "sqlite3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url ?? "");
    const video_id = searchParams.get("video_id");
    if (!video_id) {
      return new Response(
        JSON.stringify({
          status: 400,
          error: "video_id is required",
        }),
        {
          status: 400,
        }
      );
    }
    const db: Database = await getDatabaseConnection();
    const result = await db.get(
      `
                select
                    p.video_id
                    , v.filepath
                    , p.frame_number
                    , p.id as pose_id
                    , p.x
                    , p.y
                    , p.person_index
                    , p.marker_group_id
                    , p.keypoints
                from
                    pose p
                    inner join video v 
                        on v.id = p.video_id
                where v.id = ?
        `,
      video_id
    );
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return new Response(
      JSON.stringify({
        status: 500,
        error: (error as unknown as Error).message,
      }),
      {
        status: 500,
      }
    );
  }
}
