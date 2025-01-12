import cv2
import sys
import numpy as np
from PoseDetector import PoseDetector
from AnalysisDB import AnalysisDB
import argparse

MASK_HEIGHT = 1080
MASK_WIDTH = 1920
MASK_START_X = 0
MASK_START_Y = 0
THRESHOLD = 100
EROS_KERNEL_SIZE = 10
DILATION_SIZE = 5
DETECT_AREA_UPPER = 10000
DETECT_AREA_LOWER = 0


def dilation(dilationSize, kernelSize, img):  # 膨張した画像にして返す
    kernel = np.ones((kernelSize, kernelSize), np.uint8)
    element = cv2.getStructuringElement(
        cv2.MORPH_RECT, (5 * dilationSize + 1, 5 * dilationSize + 1), (dilationSize, dilationSize))
    dilation_img = cv2.dilate(img, kernel, element)
    return dilation_img


def detect(gray_diff, thresh_diff=THRESHOLD, dilationSize=DILATION_SIZE, kernelSize=20):  # 一定面積以上の物体を検出
    retval, black_diff = cv2.threshold(
        gray_diff, thresh_diff, 255, cv2.THRESH_BINARY)  # 2値化
    dilation_img = dilation(dilationSize, kernelSize, black_diff)  # 膨張処理
    img = dilation_img.copy()
    # 収縮
    if EROS_KERNEL_SIZE > 0:
        kernel = np.ones((EROS_KERNEL_SIZE, EROS_KERNEL_SIZE), np.uint8)
        erosion = cv2.erode(dilation_img,kernel,iterations = 1)
    else:
        erosion = dilation_img
    # 境界線検出
    contours, hierarchy = cv2.findContours(
        erosion, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    ball_pos = []

    for i in range(len(contours)):  # 重心位置を計算
        count = len(contours[i])
        area = cv2.contourArea(contours[i])  # 面積計算
        x, y = 0.0, 0.0
        for j in range(count):
            x += contours[i][j][0][0]
            y += contours[i][j][0][1]

        x /= count
        y /= count
        x = int(x)
        y = int(y)
        if int(area) > DETECT_AREA_UPPER or int(area) < DETECT_AREA_LOWER :
            break
        ball_pos.append([x, y, area])

    return ball_pos, img


def displayCircle(image, ballList, thickness, frame_id, frame, video_id):
    conn, cursor = AnalysisDB().get_cursor()
    overlay = image.copy()
    try:
        for i in range(len(ballList)):
            x = int(ballList[i][0])
            y = int(ballList[i][1])
            area = int(ballList[i][2])
            cv2.circle(image, (x, y), 10, (0, 0, 255), thickness)
            image = cv2.addWeighted(overlay, 0.3, image, 0.7, 0)
            h,w,c = frame.shape
            cursor.execute('''
                    INSERT INTO pose
                    (video_id, frame_number, x, y, keypoints)
                    VALUES (?, ?, ?, ?, ?)
                    ''', (
                        video_id,
                        frame_id,
                        x/w,
                        y/h,
                        'object'
                    ))
            conn.commit()
    finally:
        conn.close()
    return image


def resizeImage(image, w=2, h=2):
    height = image.shape[0]
    width = image.shape[1]
    resizedImage = cv2.resize(image, (int(width / w), int(height / h)))
    return resizedImage


def blackToColor(bImage):
    colorImage = np.array((bImage, bImage, bImage))
    colorImage = colorImage.transpose(1, 2, 0)
    return colorImage


def run(input_video_path, output_video_path, debug_video_path, video_id):
    video = cv2.VideoCapture(input_video_path)  # videoファイルを読み込む
    #inFourcc = cv2.VideoWriter_fourcc(*'mp4v')
    outFourcc = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
    if not video.isOpened():  # ファイルがオープンできない場合の処理.
        print("Could not open video", input_video_path)
        sys.exit()

    vidw = video.get(cv2.CAP_PROP_FRAME_WIDTH)
    vidh = video.get(cv2.CAP_PROP_FRAME_HEIGHT)
    print(vidw, vidh)
    out = cv2.VideoWriter(output_video_path, outFourcc, 60.0,
                          (int(vidw), int(vidh)))  # 出力先のファイルを開く
    out2 = cv2.VideoWriter(debug_video_path, outFourcc, 60.0,
                          (int(vidw), int(vidh)))  # 出力先のファイルを開く

    ok, frame = video.read()  # 最初のフレームを読み込む
    if not ok:
        print('Cannot read video file')
        sys.exit()

    frame_pre = frame.copy()
    frame_count = 1  # フレーム番号を保持する変数

    while True:
        frame_count += 1  # フレーム番号をカウントアップ
        frame_next = frame.copy()
        color_diff = cv2.absdiff(frame_next, frame_pre)  # フレーム間の差分計算
        ok, frame4 = video.read()  # フレームを読み込む
        if not ok:
            break
        color_diff2 = cv2.absdiff(frame4, frame_next)
        im_mask = np.zeros((int(vidh), int(vidw), 3), np.uint8)
        im_mask = cv2.rectangle(im_mask, (MASK_START_X, MASK_START_Y), (
            MASK_START_X + MASK_WIDTH, MASK_START_Y + MASK_HEIGHT), (255, 255, 255), -1)
        im_mask = cv2.cvtColor(im_mask, cv2.COLOR_BGR2GRAY)
        diff = cv2.bitwise_and(color_diff, color_diff2)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        gray_diff_m = cv2.bitwise_and(gray_diff, im_mask)
        ball, dilation_img = detect(gray_diff_m)

        frame = displayCircle(frame, ball, -1, frame_count, frame, video_id)  # 丸で加工
        cImage = blackToColor(dilation_img)  # 2値化画像をカラーの配列サイズと同じにする
        frame = PoseDetector().detect_pose(frame, frame_count, video_id)
        frame_pre = frame_next # 次のフレームの読み込み
        # フレーム番号をフレームに描画
        cv2.putText(frame, f'Frame: {frame_count}', (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.imshow("Tracking", frame)  # フレームを画面表示
        out.write(frame)
        out2.write(cImage)
        
        # 先読みしたフレームを次の処理対象にする
        frame = frame4
        
        k = cv2.waitKey(1) & 0xff  # ESCを押したら中止
        if k == 27:
            break
    video.release()
    out.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='動画処理プログラム')
    parser.add_argument('--input', default='test.mp4', help='入力動画ファイル')
    parser.add_argument('--sceneId', default='', help='クライアントで生成されたシーンID')
    parser.add_argument('--videoId', default='', help='入力動画ファイルのID')
    # 引数をパース
    args = parser.parse_args()
    inputFile = args.input
    video_id = args.videoId
    print(args)
    outputFile = "output.mp4"
    debugFile = "debug.mp4"
    run(inputFile, outputFile, debugFile, video_id)
