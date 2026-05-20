# 切片拉伸笔刷 · progress

## 当前状态：v0.3（开发中 · 大改）

**在线试玩**：https://appapp777.github.io/slice-stretch-brush/
**Repo**：https://github.com/AppApp777/slice-stretch-brush（公开）

单文件 HTML（`index.html`），浏览器双击或访问 Pages 即玩。

## v0.3 改动（相比 v0.2）

### 算法大改：曲线渲染彻底无缝
- v0.2 的「逐段矩形 stamp + round-join 平分角补丁」彻底废弃
- 改用「affine quad strip」：相邻两 path 点之间画一个梯形（拆 2 个 affine 三角形），相邻段共享 `path[i] ± perp[i]` 端点 → 几何上严丝合缝
- 1px 中行提前抽到独立 `midRow` canvas（W×1），避免 affine 采样污染到 cutY+1 行
- 内部点用 miter join：法线 = 相邻两段法线之和归一化；miter 长度 = 1/|cos(半夹角)|，capped 4 倍防尖角刺穿

### 交互升级
- **切割线**：「点两点」改成「按下拖动 → 实时预览 → 抬起提交」；触屏同步
- 拖出框释放也算正常提交（用 window mouseup 兜底）

### 笔触属性扩展
- **透明度**滑杆 5%~100%（globalAlpha）
- **羽化**滑杆 0~20 px（filter blur，画到 offscreen 再 blur 复制到目标）
- **色相**滑杆 ±180°（filter hue-rotate）
- 每一笔记录画时的 4 个属性（scale / alpha / feather / hue），改滑杆只影响新笔画

### 操作面板
- 加 **重做** 按钮 + `Ctrl+Shift+Z` / `Ctrl+Y` 快捷键
- 撤销与重做共用栈：新笔画落定清空 redoStack
- 加快捷键提示面板（侧栏底部）

## 算法核心（v0.3 版本）

1. **预渲染 sliced canvas**：源图绕切割中点旋转 `-cutAngle`，切割线变水平 `y = diag/2`
2. **提取 midRow**：单独把 cutY 那一行像素抽到 `W×1` 的小 canvas，曲线段铺设时直接用
3. **直线拉伸**：`ctx.translate(anchor)+ctx.rotate(stretchAngle+π/2)` 进入局部坐标系。下半截 → 中段 1px → 上半截
4. **曲线拉伸（affine quad strip）**：
   - 每个 path 点算「联结法线」+ miter 长度
   - 每相邻两点画一个梯形（= 2 个 affine 三角形）：源 midRow 的 (0,0)-(W,0)-(W,1)-(0,1) → dest `(aL, aR, bR, bL)`
   - 相邻段端点完全重合，无 gap、无 alpha 叠加缝
5. **filter 一次性应用**：羽化 / 色相 / 透明度通过先画到 offscreen 再带 filter 复制到目标，避免每个 affine 三角形都触发 GPU filter

## 文件清单

- `index.html` — 主程序（单文件，纯前端，离线可用）
- `progress.md` — 本文件
- `BUGS.md` — bug 历史档案
- `CLAUDE.md` — 项目级 Claude 指引
- `README.md` — 公开门面（中英）
- `.claude/settings.json` — Claude Code 项目级配置

## 下一步（按优先级）

- 多源图切换（preset 管理，每张图记忆自己的切割线）
- 画布尺寸可调（输入 W×H + 应用按钮）
- 笔触末端缓动衰减（让一笔末梢自然变细，模仿真实笔锋）
- 拖动期间显示笔触轨迹预览参考线
- 撤销栈持久化到 localStorage（关闭页面不丢）

## 如何打开

直接双击 `index.html`，浏览器即开。所有功能纯前端，不需要后端 / 不联网。
