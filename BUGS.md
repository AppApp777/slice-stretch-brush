# BUGS · 切片拉伸笔刷

> 倒序，最新在最上。每个 bug ≤ 10 行。

## 2026-05-20 — 曲线笔触仍能看到细缝（v0.4 OVERLAP 也没根治）
- **症状**：v0.4 加了 0.75 px 段间 OVERLAP，肉眼仍能看见笔触身上断断续续的极细白缝
- **根因**：OVERLAP 只能扩 dest 几何边界，但**clip path 本身就是 1-bit 栅格化**——浮点坐标四舍五入到不同像素让相邻段的 clip 边在 sub-pixel 上漏出。无论 OVERLAP 多大，clip 边的 1-bit 误差永远存在，只是位置变了
- **修法**：彻底放弃 `ctx.clip() + affine triangle`，曲线渲染改 **stamp brush**：沿 path 每 0.4 px 一个 `W × 2.0 px` 矩形 stamp，`drawImage(midRow, ..., -halfW, -STAMP_H/2, Wd, STAMP_H) + ctx.rotate(切线方向)`。相邻 stamp 沿切线方向重叠 1.6 px，密铺无空隙；**没有 clip，没有 affine 边界 → 没有任何栅格化误差**
- **副作用**：性能 ~2500 stamps / 笔（1000 px path），约 30 ms 渲染——可接受
- **文件**：[index.html](index.html) `drawCurvedStretch` 整段重写

## 2026-05-20 — 曲线笔触密集白色细缝（v0.3 affine quad 仍未根治）
- **症状**：v0.3 用 affine quad 渲染后，肉眼看仍有密集的白色垂直细缝沿笔触横截面方向遍布全身；笔触越粗越明显（截图显示棕色"蛇"身上几十条 1~2 px 白缝）
- **根因**：每段独立 `ctx.clip(梯形) + setTransform + drawImage`，相邻段的 clip path 在公共边上是 **1-bit 栅格化**——浮点坐标四舍五入到不同像素 → 段 i 的远端 clip 边和段 i+1 的近端 clip 边各漏 0.5~1 px → 公共边两侧背景透出 → 白色细缝
- **修法**：每段沿 segment 方向各扩 0.75 px（OVERLAP）→ 相邻段 1.5 px 重叠 → 吃掉栅格化误差；下半截/上半截 stamp 同样扩 OVERLAP 与首/末段重叠；直线模式 3 段间也同步加 OVERLAP
- **副作用**：source mapping 不变，dest 沿 path 方向被拉长 1.5 px → 由于 source 是 1 像素中行（沿 path 方向无变化），视觉无影响
- **文件**：[index.html](index.html) `drawCurvedStretch` + `drawStretchedShape` 内 `OVERLAP = 0.75` 常量

## 2026-05-20 — 曲线笔触仍然「断」（v0.2 的补丁不够彻底）
- **症状**：v0.2 的 round-join 补丁理论上盖住外侧楔形 gap，但用户仍能看见「稀缝」
- **根因**：v0.2 是「每段矩形 stamp + cur 处补丁」，相邻段端点用不同方向短边相接 → 切割线那一行像素两端列 alpha < 100%（抗锯齿）→ 公共边叠加只到 75% → 看起来稀缝。补丁也是矩形同样问题
- **修法**：彻底换 affine quad strip 算法（v0.3）—— 相邻段共享 `path[i] ± perp[i]` 端点，几何上严丝合缝，无 alpha 叠加
- **后续**：v0.3 修了 alpha 叠加但暴露了 clip 栅格化的新缝（见上一条）
- **文件**：[index.html](index.html) `drawAffineTri` + 重写的 `drawCurvedStretch`

## 2026-05-19 — 曲线笔刷转弯处断裂
- **症状**：曲线模式画弧线、转弯，外侧出现明显空白缝；笔触越粗、转弯越急越明显
- **根因**：每段中行用自段切线做旋转，相邻段在公共端点旋转方向不同 → 外侧缝隙 ≈ `(Wd/2)·tan(Δθ/2)`，笔触 200px、转弯 30° 时缝隙达 27px
- **修法**：每个内部 path 点加平分角方向中行 stamp（圆角接头），高度 `Wd·tan(|Δθ|/2)`；采样从 2.5px 缩到 1.5px
- **后续**：2026-05-20 发现仍有 alpha 叠加问题，v0.3 重写为 affine quad；v0.4 再用 OVERLAP 修栅格化缝
- **文件**：[index.html](index.html) — 已被 v0.3 删除
