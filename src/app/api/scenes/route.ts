import { getDatabaseConnection } from "@/utils/database";

export async function GET() {
  try {
    const db = getDatabaseConnection();
    const result = db.prepare(`
        select
            s.scene_id
            , v.filepath
            , s.start_frame
            , s.end_frame
            , s.release_frame
            , s.catch_frame 
        from
            scene s 
            inner join video v 
                on v.id = s.video_id
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
