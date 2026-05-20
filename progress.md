# 切片拉伸笔刷 · progress

## 当前状态：v0.4（功能完整 · 苹果级 UI）

**在线试玩**：https://appapp777.github.io/slice-stretch-brush/
**Repo**：https://github.com/AppApp777/slice-stretch-brush（公开）

单文件 HTML（`index.html`），浏览器双击或访问 Pages 即玩。

## v0.4 总览

### 渲染稳定性（核心）
- 曲线渲染：affine quad strip + **段间 0.75 px overlap**，吃掉 1-bit clip 栅格化误差 → 不再有「白色细缝」
- 直线渲染：下半截/中段/上半截 3 段间 OVERLAP 同步，同样消缝
- 1px 中行抽到独立 `midRow` canvas，affine 采样不污染相邻行
- miter join（capped 4 倍）防尖角刺穿

### 多源图笔刷库
- `state.brushes` 数组，每张图独立记忆切割线和 sliced
- 缩略图 grid（4 列），点切换，悬停删除
- 未定义切线的 brush 显示橙色小圆点
- 每一笔记录自己使用的 `brushId`，drawStroke 用 brushId 找对应 brush —— 切换图后历史笔画仍正确显示

### 笔触属性（每笔独立记录）
- 粗细 5%~300%
- 透明 5%~100%
- 羽化 0~20 px（filter blur，offscreen 中转）
- 色相 ±180°（filter hue-rotate）
- 末端收尖（笔锋感，smoothstep 衰减最末 N 段 miter）

### 交互升级
- 切割线：按下拖动实时预览（替代点两点）；触屏同步；拖出框释放也算正常提交
- Shift 切曲线 · `[` `]` 粗细 · Ctrl+Z 撤销 · Ctrl+Shift+Z / Ctrl+Y 重做

### 画布 & 背景
- 画布尺寸输入（宽 × 高 + 应用），200~4096 范围
- 背景：透明（棋盘）/ 自定义色 picker
- 导出 PNG 同步背景色

### 自动持久化
- 所有状态写入 localStorage（key: `slice-stretch-brush:v1`）
- 包括：brushes（图片 dataURL + 切线点）、strokes、活跃 brush、画布尺寸、背景设置
- 启动自动 `tryRestore()`，意外刷新不丢工作

### 苹果级 UI 升级
- 配色：iOS 系灰白（#f4f5f7 底 / #1d1d1f 文字 / #0a84ff 主色）
- 圆角 6 / 10 / 14 三档
- 自定义滑杆 thumb（细轨道 + 14 px 圆点 + hover 放大）
- 按钮 hover/active 微动
- mode-toggle 改 iOS segmented control 风格
- 状态卡片配色更克制
- sidebar 加 scrollbar 细化

## 算法核心

1. **预渲染 sliced canvas**：源图绕切割中点旋转 `-cutAngle`，切割线变水平 `y = diag/2`；同时抽出 cutY 那一行做独立 `midRow` canvas
2. **直线拉伸**：3 段 stamp 在 local Y 轴铺设，每个接缝处沿 path 方向各扩 OVERLAP（0.75 px）→ 1.5 px 重叠
3. **曲线拉伸**：每个 path 点算联结法线 + miter；每相邻两点画一个梯形（拆 2 个 affine 三角形），dest 端点沿 segment 方向各扩 OVERLAP；下半截/上半截 stamp 也扩 OVERLAP 与首/末段重叠
4. **filter 一次性应用**：羽化/色相/透明度用 offscreen 中转，避免每个 affine 三角形都触发 GPU filter

## 不要做的事（避免破坏单文件 demo 的核心）

- ❌ 拆分为多文件
- ❌ 加构建工具 / 包管理
- ❌ 加后端
- ❌ 改公开 URL 路径
- ❌ feature branch（直接 commit 到 main）

## 文件清单

- `index.html` — 主程序（HTML+CSS+JS 全在一个文件，~1000 行）
- `progress.md` — 本文件
- `BUGS.md` — bug 历史档案
- `CLAUDE.md` — 项目级 Claude 指引
- `README.md` — 公开门面
- `.claude/settings.json` — Claude Code 项目级配置

## 下一步（按优先级）

- 笔触压感（鼠标拖动速度 → 粗细变化）
- 多笔同时被擦除（橡皮擦工具）
- 路径平滑（贝塞尔拟合，让手抖路径自动顺滑）
- 主题切换（深色模式）
- 导入图层（SVG / 文本作为笔触轨迹）

## 如何打开

双击 `index.html`，浏览器即开。所有功能纯前端，不需要后端 / 不联网。
