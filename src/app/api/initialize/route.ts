import { getDatabaseConnection } from "@/utils/database";

export async function GET() {
  try {
    const db = getDatabaseConnection();
    const initializeVideoSql = `
        CREATE TABLE IF NOT EXISTS video (id INTEGER PRIMARY KEY, filepath TEXT);
    `;
    const initializeSceneSql = `
        CREATE TABLE IF NOT EXISTS scene (
            scene_id INTEGER PRIMARY KEY,
            video_id INTEGER,
            start_frame INTEGER,
            end_frame INTEGER,
            release_frame INTEGER,
            catch_frame INTEGER,
            FOREIGN KEY (video_id) REFERENCES video (id)
        );
    `;
    const initializeMarkerGroupSql = `
        CREATE TABLE IF NOT EXISTS marker_group (id INTEGER PRIMARY KEY, name TEXT);
    `;
    const initializePoseSql = `
        CREATE TABLE IF NOT EXISTS pose (
            id INTEGER PRIMARY KEY,
            video_id INTEGER,
            frame_number INTEGER,
            x REAL,
            y REAL,
            person_index INTEGER,
            marker_group_id INTEGER,
            keypoints TEXT,
            FOREIGN KEY (marker_group_id) REFERENCES marker_group (id) FOREIGN KEY (video_id) REFERENCES video (id)
        );
    `;

    db.prepare(initializeVideoSql).run();
    db.prepare(initializeSceneSql).run();
    db.prepare(initializeMarkerGroupSql).run();
    db.prepare(initializePoseSql).run();
    return new Response('', { status: 200 });
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
