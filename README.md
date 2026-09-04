# 切片拉伸笔刷 · Slice-Stretch Brush

> 把一张图（推荐透明底 PNG）从**任意角度**切一刀，再拖动上半截**拉伸成胶囊**——或者沿鼠标轨迹**弯曲当笔刷**写字画画。

**🍎 在线试玩** → **<https://appapp777.github.io/slice-stretch-brush/>**

![single-file](https://img.shields.io/badge/single--file-blueviolet) ![no-build](https://img.shields.io/badge/no--build-success) ![no-backend](https://img.shields.io/badge/no--backend-success) ![mit](https://img.shields.io/badge/license-MIT-blue)

**当前版本 v0.5** · 最后一次代码改动 2026-05-20 · 全部产品就是一个 `index.html`，1330 行。

---

## 灵感来源

某天画了张草图，问 AI：“苹果横切一刀，拖着上半截走，中间能不能像橡皮泥一样拉长？”写了半天，发现不仅能拉成胶囊，**沿轨迹弯曲就成了能写字的笔刷**——苹果做的笔，写出来的字还是苹果味的。

---

## 玩法

| 步骤 | 操作 |
|---|---|
| ① 加载图片 | 点“+ 加载图片”传 PNG / JPG，或点“+ 示例苹果”立即试玩。可以同时放多张，缩略图点一下就切换，**每张图独立记忆自己的切割线** |
| ② 定义切割线 | 点“在原图上拖一条线 ↘”，再到左侧小预览图上**按下并拖出一条线**（拖动时实时预览，任意角度） |
| ③ 直线拉伸 | 在右侧大画布**鼠标拖拽**——上半截跟着光标走，中段被拉成胶囊 |
| ④ 曲线写字 | **按住 `Shift` 拖拽**——中段沿鼠标轨迹弯曲，可当笔刷写字 |
| ⑤ 调笔触 | 四条滑杆：粗细 5%~300%（也可按 `[` / `]` 每次 ±10%）、透明 5%~100%、羽化 0~20 px、色相 ±180°，外加“末端收尖”勾选框做笔锋。**每一笔各自记住画它时的设定** |
| ⑥ 调画布 | 画布尺寸 200~4096 自定义；底色可选透明（棋盘格）或自定义颜色，导出时同步 |
| ⑦ 撤销 / 清屏 / 导出 | `Ctrl+Z` 撤销 · `Ctrl+Shift+Z` 或 `Ctrl+Y` 重做 · “清空画布”清屏 · “导出 PNG”存图 |
| ⑧ 自动保存 | 图片、切割线、全部笔画、画布与背景设置自动写进 localStorage，刷新页面自动恢复 |

---

## 算法核心（写给好奇的人）

### 切片预渲染
把源图绕**切割中点**旋转 `-cutAngle`，存到一个 `diag × diag` 的内部 canvas（diag = 原图对角线）。**关键不变量**：在这个内部 canvas 里，切割线一定是水平线 `y = diag/2`，之后所有渲染都基于这个不变量。

### 直线拉伸
```
const OVERLAP = 0.75;            // 接缝处每边外扩，凑成 1.5 px 重叠吃掉栅格化误差
ctx.translate(anchor.x, anchor.y);
ctx.rotate(stretchAngle + π/2);  // 进入局部坐标
// local +Y 永远指向远离 target 的方向
ctx.drawImage(sliced, 0, cutY, W, botExtent, -Wd/2, -OVERLAP,              Wd, botD + OVERLAP);         // 下半截
ctx.drawImage(sliced, 0, cutY, W, 1,         -Wd/2, -stretchLen - OVERLAP, Wd, stretchLen + OVERLAP*2); // 中段 (1px → 拉伸)
ctx.drawImage(sliced, 0, 0,    W, topExtent, -Wd/2, -stretchLen - topD,    Wd, topD + OVERLAP);         // 上半截
```

### 曲线拉伸（v0.5 · stamp brush）

路径每 1.5 px 采样一点。中段**不是**“相邻两点画一片”，而是沿路径每 `STAMP_STEP = 0.4 px` 盖一个 `W × 2 px` 的矩形 stamp，`drawImage(midRow, …)` 配合 `ctx.rotate(切线方向)`——相邻 stamp 沿切线重叠 1.6 px，密铺无空隙。

绕这么大弯是被逼的：早期版本用 `ctx.clip()` 裁梯形（后来换 affine 三角形）拼接，而 **clip path 本身是 1-bit 栅格化**——浮点端点四舍五入到不同像素，相邻段的公共边永远漏出白色细缝，重叠量调多大都没用。stamp 方案彻底不碰 clip、不碰 affine 变换，也就不存在栅格化边界。三轮踩坑的完整过程见 [BUGS.md](BUGS.md)。

急弯外侧仍会剩一块楔形空白，用一个“沿平分角方向、高度 `Wd · |tan(Δθ/2)|`”的补丁 stamp 填掉；起点与终点分别盖上完整的下半截 / 上半截。勾了“末端收尖”时不画终点，改让最后 25% 弧长的 stamp 宽度按 smoothstep 衰减到 0，收出笔锋。

### 笔触粗细
横截面 + 上下半截高度按 `scale` 缩放，**中段长度始终等于鼠标拖距**——这样调粗细不会影响“拉多长”的手感。

### 羽化 / 色相 / 透明
这三样一旦启用，就先把整笔画到一张离屏 canvas，再带 `filter` 一次性贴回目标——否则成千上万个 stamp 每一个都要触发一次 GPU filter。

---

## 技术栈

| | |
|---|---|
| 渲染 | HTML5 Canvas 2D |
| 代码 | 纯前端，单文件 `index.html`（HTML + CSS + JS 全在一个文件） |
| 构建 | 无（不需要 npm / webpack / vite） |
| 后端 | 无（所有处理在浏览器内） |
| 部署 | GitHub Pages 直接托管 |
| 移动端 | ⚠️ 触屏**事件**做了（手指 = 鼠标），但**版式没做**——缺 viewport meta、零媒体查询、侧栏宽度写死，手机上会被整体缩放到难以操作。目前请当桌面工具用 |

---

## 本地开发

```bash
git clone https://github.com/AppApp777/slice-stretch-brush.git
cd slice-stretch-brush
# 双击 index.html 即开，或：
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

改完 `index.html` 直接 `git push`，1~2 分钟后线上自动更新。

---

## 已知限制

按 2026-08-22 通读代码的结果，下面几条现在就存在，逐条的行号在 [BUGS.md](BUGS.md) 的“已知问题”一节：

- **自动保存可能悄悄失效**：所有图片以 dataURL 形式塞进 localStorage，几张大图就会撑爆浏览器配额；写入失败被静默吞掉，页面上看不出任何异常，刷新后工作全丢。图别加太多，重要的画完就导出 PNG。
- **末端收尖遇上急弯会凸出一块**：收尖段的转角补丁 stamp 没跟着一起收窄，仍按满宽画。
- **极端回折会画出一条超长条带**：路径接近 180° 折返时，转角补丁的高度按 `tan(Δθ/2)` 计算会爆炸。
- **鼠标移出画布即落笔**：拖到画布外面这一笔就提交了，拖回来接不上。
- **触屏没处理 `touchcancel`**：被来电或系统手势打断时，这一笔会一直悬着不落定。
- **长曲线越画越卡**：实时预览每帧重画整条路径的全部 stamp，笔画越长掉帧越明显。
- **手机上版式没做**：触屏事件有，但缺 viewport meta 和媒体查询，请当桌面工具用。
- 触屏压力感应（Pointer Events `pressure`）尚未支持。

---

## License

[MIT](LICENSE)
