type Point = {
  x: number | undefined
  y: number | undefined;
};

export const calculateAngle = (
  point1: Point,
  point2: Point,
  point3: Point
): number | null => {
  if(!point1.x || !point1.y || !point2.x || !point2.y || !point3.x || !point3.y) {
    return null;
  }
  // ベクトルの計算
  const vector1: Point = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  };

  const vector2: Point = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
  };

  // 内積の計算
  const dotProduct = vector1.x! * vector2.x! + vector1.y! * vector2.y!;

  // ベクトルの大きさを計算
  const magnitude1 = Math.sqrt(vector1.x! * vector1.x! + vector1.y! * vector1.y!);
  const magnitude2 = Math.sqrt(vector2.x! * vector2.x! + vector2.y! * vector2.y!);

  // 0除算を防ぐ
  if (magnitude1 === 0 || magnitude2 === 0) {
    throw new Error("ベクトルの大きさが0になっています");
  }

  // アークコサインで角度を計算（ラジアン）
  const cosTheta = dotProduct / (magnitude1 * magnitude2);

  // cosθが-1から1の範囲を超えないようにクランプする
  const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));

  // ラジアンから度数に変換
  const angleInDegrees = (Math.acos(clampedCosTheta) * 180) / Math.PI;

  return angleInDegrees;
};
