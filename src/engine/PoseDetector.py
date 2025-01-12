import cv2
from collections import deque
from AnalysisDB import AnalysisDB
from ultralytics import YOLO

class PoseDetector:
    def __init__(self, fps=60):
        self.fps = fps
        self.debug = True
        
        self.model = YOLO("yolo11n-pose.pt")
        # 姿勢の履歴
        self.pose_history = deque(maxlen=30)  # 1秒分の履歴

        self.keypoint_names = [
            "nose",  # 0
            "eye(L)",  # 1
            "eye(R)",  # 2
            "ear(L)",  # 3
            "ear(R)",  # 4
            "shoulder(L)",  # 5
            "shoulder(R)",  # 6
            "elbow(L)",  # 7
            "elbow(R)",  # 8
            "wrist(L)",  # 9
            "wrist(R)",  # 10
            "hip(L)",  # 11
            "hip(R)",  # 12
            "knee(L)",  # 13
            "knee(R)",  # 14
            "ankle(L)",  # 15
            "ankle(R)",  # 16
        ]
        
        self.db = AnalysisDB(db_path="sqlite.db")

    def detect_pose(self, frame, frame_id, video_id):
        """姿勢推定"""
    
        conn, cursor = self.db.get_cursor()
        h, w, _ = frame.shape  # フレームのサイズを最初に取得
        
        try:
            # 姿勢推定の実行
            results = self.model(frame)
            annotatedFrame = results[0].plot()
            
            # 検出されたすべての人物に対して処理
            keypoints = results[0].keypoints
            boxes = results[0].boxes
            
            for person_id, (box, person_keypoints) in enumerate(zip(boxes, keypoints)):
                # バウンディングボックスの座標を取得（正規化）
                x1, y1, x2, y2 = [int(i) for i in box.xyxy[0]]
                bbox_normalized = {
                    'x1': x1/w,
                    'y1': y1/h,
                    'x2': x2/w,
                    'y2': y2/h
                }
                
                # キーポイントの座標と信頼度を取得
                person_xys = person_keypoints.xy[0].tolist()  # 一人分のキーポイント座標
                person_confs = person_keypoints.conf[0].tolist()  # 一人分の信頼度
                
                # 各キーポイントについて処理
                for index, (xy, conf) in enumerate(zip(person_xys, person_confs)):
                    # スコアが0.3以下なら処理をスキップ
                    if conf < 0.3:
                        continue
                    
                    # 座標の正規化
                    x = xy[0]/w
                    y = xy[1]/h
                    
                    print(
                        f"Person {person_id}, Keypoint Name={self.keypoint_names[index]}, "
                        f"X={x:.4f}, Y={y:.4f}, Score={conf:.4f}, "
                        f"BBox=[{bbox_normalized['x1']:.4f}, {bbox_normalized['y1']:.4f}, "
                        f"{bbox_normalized['x2']:.4f}, {bbox_normalized['y2']:.4f}]"
                    )
                    
                    # データベースに保存
                    cursor.execute('''
                    INSERT INTO pose
                    (video_id, frame_number, x, y, person_index, keypoints)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        video_id,
                        frame_id,
                        x,
                        y,
                        person_id,
                        index
                    ))
                
                conn.commit()  # 一人分のキーポイントをまとめてコミット
                
        finally:
            conn.close()
            
        return annotatedFrame

    
    def analyze_frame(self, frame1):
        """フレーム分析（姿勢推定と物体検出を統合）"""
        # 姿勢推定
        pose_keypoints = self.detect_pose(self, frame1)
        self.pose_history.append(pose_keypoints)
        
        return pose_keypoints
    
    def visualize(self, frame, pose_keypoints, objects):
        """結果の可視化"""
        output = frame.copy()
        
        # 姿勢の描画
        self.draw_pose(output, pose_keypoints)
        
        # ボールと軌跡の描画
        output = self.speed_detector.visualize(output, objects)
        
        # 投球フェーズの表示
        phase_text = [phase for phase, active in self.pitching_phases.items() if active]
        if phase_text:
            cv2.putText(output, f"Phase: {phase_text[0]}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       1, (0, 255, 0), 2)
        
        return output
    
    def draw_pose(self, image, keypoints):
        """姿勢のキーポイントと骨格の描画"""
        # キーポイントの接続関係
        connections = [
            (5, 6),   # shoulders
            (5, 7),   # left upper arm
            (7, 9),   # left lower arm
            (6, 8),   # right upper arm
            (8, 10),  # right lower arm
            (5, 11),  # left trunk
            (6, 12),  # right trunk
            (11, 12), # hips
            (11, 13), # left thigh
            (13, 15), # left calf
            (12, 14), # right thigh
            (14, 16)  # right calf
        ]
        
        # キーポイントの描画
        for i, (x, y, conf) in enumerate(keypoints):
            if conf > 0.4:  # 信頼度が閾値より高い場合のみ描画
                cv2.circle(image, (int(x), int(y)), 5, (0, 255, 0), -1)
        
        # 骨格線の描画
        for connection in connections:
            if (keypoints[connection[0]][2] > 0.5 and 
                keypoints[connection[1]][2] > 0.5):
                pt1 = (int(keypoints[connection[0]][0]), 
                      int(keypoints[connection[0]][1]))
                pt2 = (int(keypoints[connection[1]][0]), 
                      int(keypoints[connection[1]][1]))
                cv2.line(image, pt1, pt2, (0, 255, 0), 2)