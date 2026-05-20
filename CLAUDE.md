# slice-stretch-brush · 项目说明（给 Claude Code 看的）

> 这是一个**独立单文件**前端 demo——把图像切片后拖动拉伸成胶囊 / 沿轨迹弯曲当笔刷。
> 在 `D:/VIBE CODING/A-切片拉伸笔刷/` 启动 Claude Code 时本文件自动加载。

## 一句话定位

纯前端 HTML5 Canvas，**单文件 `index.html` 就是全部产品**，零依赖、零构建、零后端。GitHub Pages 直接当静态托管。

## 当前线上

- **公开试玩**：https://appapp777.github.io/slice-stretch-brush/
- **Public repo**：https://github.com/AppApp777/slice-stretch-brush
- **分支策略**：只用 `main`，push 后 GitHub Pages 自动重建

## 文件结构

```
A-切片拉伸笔刷/
├── index.html          # 全部产品代码（HTML+CSS+JS）
├── README.md           # 公开站门面（中英，主页可见）
├── LICENSE             # MIT
├── progress.md         # 项目状态（覆盖更新，给用户和 Agent 都看）
├── BUGS.md             # bug 历史档案（倒序，每修一个加一条）
├── CLAUDE.md           # 本文件
├── .claude/
│   └── settings.json   # 项目级 Claude Code 配置
├── .gitignore
└── .git/
```

**不要**新建 `src/` `dist/` `node_modules/` `package.json`——这是单文件项目，保持简单是核心价值。

## 开发协议

1. **改 `index.html` 之前**：在浏览器里打开当前版本，确认基线行为。
2. **改完之后**：双击打开 `index.html` 跑一遍：加载图 → 切线 → 直线拖 → 曲线拖 → 粗细调 → 撤销 → 导出。
3. **关键算法变动**（`drawStretchedShape` / `drawCurvedStretch` / `prepareSlicedImage`）：写改动前在 BUGS.md 或 progress.md 留一笔"为什么这样改"。
4. **commit message**：以 `feat:` / `fix:` / `docs:` 起头；功能影响线上行为时加 `breaking:` 前缀。
5. **push 即部署**：`git push` 后 1~2 分钟 GitHub Pages 自动重建，无需 CI。

## 核心算法（改之前必读）

### 切片预渲染 `prepareSlicedImage`

把源图绕切点旋转 `-cutAngle`，存到一个 `diag × diag` 的内部 canvas（diag = 原图对角线长）。**关键不变量**：在这个内部 canvas 里，**切割线一定是水平线 `y = diag/2`**。之后所有渲染都基于这个不变量。

### 直线拉伸 `drawStretchedShape(ctx, sliced, anchor, target, scale)`

- `anchor`：鼠标按下处（下半截 planted 在这里）
- `target`：鼠标当前位置（上半截贴到这里）
- 用 `ctx.translate(anchor) + ctx.rotate(stretchAngle + π/2)` 进入局部坐标系，**local +Y 永远指向远离 target 的方向**。
- 下半截贴 local Y ∈ [0, botD]、中段（1px 行）拉伸到 [-stretchLen, 0]、上半截贴 [-stretchLen - topD, -stretchLen]。
- `scale` 缩放横截面 + 上下半截高度；中段长度不缩放（始终等于鼠标拖距）。

### 曲线拉伸 `drawCurvedStretch(ctx, sliced, path, scale, taper)` —— v0.5 stamp brush

- 路径每 1.5 px 采样一点。
- **算法**：沿 path 每 `STAMP_STEP = 0.4 px` 一个矩形 stamp，`drawImage(sliced.midRow, ..., -halfW, -STAMP_H/2, Wd, STAMP_H=2.0) + ctx.rotate(切线方向)`。相邻 stamp 沿切线重叠 1.6 px → 完全密铺。
- **关键 invariant**：完全不用 `ctx.clip()` 也不用 `ctx.transform()` affine 三角形 → 没有任何 1-bit 栅格化边界 → **绝对无缝**。
- 段内 stamp 起点用累计弧长 `walked` 对齐 STAMP_STEP 整数倍，保证段间 stamp 不双盖也不漏。
- 急弯外侧楔形 gap 保留 round-join 补丁：每个内部 path 点画一个平分角方向 stamp，高度 = `Wd · |tan(Δθ/2)|`。
- 起点/终点用 `sliced.canvas` 完整下/上半截 stamp（带 OVERLAP 0.75 与中段 stamp 重叠）。
- `taper = true` 时不画终点 stamp；当累计弧长达 75% 后 stamp 宽度按 smoothstep 衰减到 0 → 自然笔锋。
- **历史教训**：v0.2 矩形 stamp + 平分角补丁有 alpha 叠加缝；v0.3 改 affine quad 解决 alpha 但暴露 clip 栅格化缝；v0.4 加 OVERLAP 扩 dest 边界没用——clip path 本身是 1-bit；v0.5 干脆抛弃 clip，回到 stamp brush 但用密集 stamp 密铺。
- `drawAffineTri` 函数已不再被曲线渲染使用，保留作工具（未来可能用）。

### 多源图笔刷库

- `state.brushes = [{ id, name, src, sliced, cutPoints }]`；每张图独立记忆切割线。
- `state.activeBrushId` + state.srcImage/sliced/cutPoints 作快速指代。
- stroke 记录 `brushId`，`drawStroke` 用 brushId 查对应 brush 的 sliced——切换图后历史笔画仍正确显示。

### 笔触属性（每笔独立记录）

- scale / alpha / feather / hue / taper。
- 无 filter 直接画到 ctx；有 filter（feather>0 / hue≠0 / alpha<1）先画到 `offscreenCanvas` 再一次性 filter 复制 → **避免每个 affine 三角形都触发 GPU filter**。
- 撤销/重做共用 `state.redoStack`；新笔画落定清空。

### 自动持久化

- key: `slice-stretch-brush:v1`
- 保存：brushes（图片 dataURL + 切线点）、strokes、活跃 brush、画布尺寸、背景设置。
- 在 brush 增删 / 切线定义 / 笔画完成 / undo/redo / clear / 背景或尺寸改变时调 `persist()`。
- 启动调 `tryRestore()` 异步还原（用 dataURL 重建 Image）。`restoring` flag 防止 restore 过程中触发 persist 循环。

### 画布 & 背景

- `resizeCanvases(w, h)` 同步改 mainCanvas / committedCanvas / offscreenCanvas 三个 framebuffer + rebuild。
- `state.bgTransparent` / `bgColor`：paint() 和导出时根据这两个值决定底色。

## 不要做的事

- ❌ 拆分单文件为多文件（拆了就破坏「双击即玩」属性）
- ❌ 加构建工具 / 包管理（npm/webpack/vite 等）——这是个静态 demo
- ❌ 加后端（任何 fetch/服务器调用都违反"零依赖"承诺）
- ❌ 改公开 URL 路径（`/slice-stretch-brush/` 已经在朋友圈传播）
- ❌ 在 main 之外建分支搞 "feature branch flow"——单人项目直接 commit 到 main

## 部署 / 一键发布

```bash
# 改完后
git add -A
git commit -m "feat: <一句话>"
git push          # 1~2 分钟后 https://appapp777.github.io/slice-stretch-brush/ 自动更新
```

## 路演叙事（如果别人问起）

"美团黑客松摸鱼时画了张草图：苹果横切一刀，上半截拖着走会拉成胶囊。觉得好玩，半天写了个 HTML demo——可以加载任意 PNG，任意角度切一刀，沿鼠标轨迹弯曲当笔刷用——就能拿苹果写字了。"
