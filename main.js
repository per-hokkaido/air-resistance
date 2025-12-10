// main.js
// 空気抵抗付き落下シミュレーション

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// 定数
const g = 9.8; // 重力加速度 m/s^2
const rho = 1.2; // 空気密度 kg/m^3
const dt = 0.05; // 1コマの時間間隔 [s]
const pxPerMeter = 1.5; // スケールをさらに微調整（移動距離のスケール）
const yStart = 60; // 初期y位置(px)
const yGround = 870; // 地面y座標(px)を900pxキャンバスに合わせて拡大

// 状態変数
let mass = 1; // kg
let radius = 0.5; // m（初期半径を0.5mに変更）
let Cd = 0.47; // 空気抵抗係数
let v = 0; // 速度 m/s
let y = yStart; // 画面上の初期位置(px)
let t = 0;
let playing = false;
let history = [];

function resetSim() {
  mass = parseFloat(document.getElementById('mass').value);
  radius = parseFloat(document.getElementById('radius').value);
  Cd = parseFloat(document.getElementById('material').value);
  v = 0;
  y = yStart;
  t = 0;
  history = [{v, y, t, y_m: 0}];
  draw();
}

function stepSim() {
  // 空気抵抗 Fd = 0.5 * Cd * rho * A * v^2
  const A = Math.PI * radius * radius;
  const Fg = mass * g;
  const Fd = 0.5 * Cd * rho * A * v * v * Math.sign(v);
  // 運動方程式: ma = Fg - Fd
  const a = Fg / mass - Fd / mass;
  v += a * dt;
  // y座標（px）を更新
  let y_m = history[history.length-1].y_m + v * dt; // 落下距離[m]
  y = yStart + y_m * pxPerMeter;
  t += dt;
  history.push({v, y, t, y_m});
  draw();
}

function draw() {
  // 左: シミュレーション
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 地面
  ctx.fillStyle = '#aaa';
  ctx.fillRect(0, yGround, canvas.width, 30);
  // 球
  ctx.beginPath();
  ctx.arc(canvas.width/2, y, radius*50, 0, 2*Math.PI); // 球体の大きさは50固定
  ctx.fillStyle = '#3498db';
  ctx.fill();
  ctx.stroke();
  // 重力ベクトル
  const Fg = mass * g;
  const gravityVecLen = 60; // px
  drawArrow(ctx, canvas.width/2, y, canvas.width/2, y + gravityVecLen, 'red', '重力');
  // 空気抵抗ベクトル
  if (Math.abs(v) > 0.01) {
    // 空気抵抗は上向き
    const A = Math.PI * radius * radius;
    const Fd = 0.5 * Cd * rho * A * v * v;
    // Fd/Fgの比率でスケール
    const dragVecLen = gravityVecLen * (Fd / Fg);
    drawArrow(ctx, canvas.width/2, y, canvas.width/2, y - dragVecLen, 'green', '空気抵抗');
  }
  // 情報表示
  ctx.fillStyle = '#222';
  ctx.font = '16px sans-serif';
  ctx.fillText(`速度: ${v.toFixed(2)} m/s`, 10, 20);
  ctx.fillText(`時刻: ${t.toFixed(2)} s`, 10, 40);

  // 右: 速度-時間グラフ
  drawGraph();
}

function drawArrow(context, x1, y1, x2, y2, color, label) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  // 矢印の先端
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(x2 - 10 * Math.cos(angle - 0.3), y2 - 10 * Math.sin(angle - 0.3));
  context.lineTo(x2 - 10 * Math.cos(angle + 0.3), y2 - 10 * Math.sin(angle + 0.3));
  context.lineTo(x2, y2);
  context.fill();
  // ラベル
  context.font = '14px sans-serif';
  context.fillText(label, x2 + 5, y2);
  context.restore();
}

function drawGraph() {
  // 右側グラフ: 速度 vs 時間
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  // 軸
  graphCtx.strokeStyle = '#222';
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  graphCtx.moveTo(70, 30); // 左マージン広げる
  graphCtx.lineTo(70, 470);
  graphCtx.lineTo(320, 470); // 右マージン広げる
  graphCtx.stroke();
  // ラベル
  graphCtx.font = '14px sans-serif';
  graphCtx.fillStyle = '#222';
  graphCtx.fillText('時刻[s]', 170, 490);
  graphCtx.save();
  graphCtx.translate(40, 300);
  graphCtx.rotate(-Math.PI/2);
  graphCtx.fillText('速度[m/s]', 0, 0);
  graphCtx.restore();
  // プロット（点列のみ）
  if (history.length > 1) {
    let maxT = Math.max(...history.map(h => h.t), 2);
    let maxV = Math.max(...history.map(h => Math.abs(h.v)), 1);
    let xScale = 230 / maxT;
    let yScale = 420 / maxV;
    graphCtx.fillStyle = '#3498db';
    for (let i = 0; i < history.length; i++) {
      let px = 70 + history[i].t * xScale;
      let py = 470 - Math.abs(history[i].v) * yScale;
      graphCtx.beginPath();
      graphCtx.arc(px, py, 3, 0, 2*Math.PI);
      graphCtx.fill();
    }
    // 現在位置を赤丸で
    let last = history[history.length-1];
    let px = 70 + last.t * xScale;
    let py = 470 - Math.abs(last.v) * yScale;
    graphCtx.fillStyle = 'red';
    graphCtx.beginPath();
    graphCtx.arc(px, py, 5, 0, 2*Math.PI);
    graphCtx.fill();
  }
}

// コマ送り
function step() {
  // 地面に到達したら止める
  if (y + radius*50 >= yGround) return;
  stepSim();
}

// 自動再生
let timer = null;
function play() {
  if (timer) return;
  timer = setInterval(() => {
    if (y + radius*50 >= yGround) { pause(); return; }
    stepSim();
  }, 50);
}
function pause() {
  clearInterval(timer);
  timer = null;
}

document.getElementById('reset').onclick = resetSim;
document.getElementById('step').onclick = step;
document.getElementById('play').onclick = play;
document.getElementById('pause').onclick = pause;

document.getElementById('mass').onchange = resetSim;
document.getElementById('radius').onchange = resetSim;
document.getElementById('material').onchange = resetSim;

resetSim();
