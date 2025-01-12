import { getDatabaseConnection } from "@/utils/database";

export async function GET() {
  try {
    const db = getDatabaseConnection();
    const result = db.prepare(`
          select
              p.video_id
              , max(frame_number) as max_frame
              , count(*) as pose_count
              , v.filepath 
          from
              pose p 
              inner join video v 
                  on v.id = p.video_id 
          group by
              p.video_id
        `).all();
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
