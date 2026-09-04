# 切片拉伸笔刷 · progress

## 当前状态：v0.5（stamp brush · 真无缝）· 闲置中

**在线试玩**：https://appapp777.github.io/slice-stretch-brush/
**远程仓**：https://github.com/AppApp777/slice-stretch-brush（建仓时设为公开；是否仍公开、Pages 是否仍在线，2026-08-22 核对时未联网验证）

单文件 HTML（`index.html`），浏览器双击或访问 Pages 即玩。

| | |
|---|---|
| 代码最后改动 | **2026-05-20**（commit `71a0fa3`，v0.5 stamp brush） |
| 文档最后实质更新 | **2026-08-22**（本次文档核对；此前 README 停在 2026-05-19 的 v0.2、CLAUDE.md 与 progress.md 停在 2026-05-20 的 v0.5） |
| 2026-07-12 / 07-13 两次提交 | 只是工作区 R2 去前缀改名（`A-切片拉伸笔刷` → `A-slice-brush` → `slice-brush`），只改了 CLAUDE.md 里两行路径，**代码零改动** |
| 本次核对结论 | 功能完整、无外部依赖、无本地服务器脚本，但通读代码盘出 15 条未修的已知问题（A1~A15，见 [BUGS.md](BUGS.md) 的“已知问题”一节），其中 localStorage 静默丢档影响最大 |

## v0.5 总览

### 渲染稳定性（核心 · v0.5 大改）
- 曲线渲染：抛弃 `ctx.clip() + affine triangle`，改 **stamp brush**——沿 path 每 0.4 px 一个 W × 2 px 矩形 stamp，drawImage + rotate，相邻 stamp 重叠 1.6 px 密铺。**没有 clip 没有 affine 边界 → 没有任何 1-bit 栅格化误差 → 绝对无缝**
- 急弯外侧 round-join 补丁 stamp：高度 = Wd · |tan(Δθ/2)| 兜底
- 直线渲染：3 段间 0.75 px OVERLAP（直线模式缝问题轻微，保留 OVERLAP 修法即可）
- 1px 中行抽到独立 `midRow` canvas，stamp 采样不污染相邻行

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
- 末端收尖（笔锋感：不画终点半截，改让最后 25% 弧长的 stamp 宽度按 smoothstep 衰减到 0）

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
- ⚠️ 但这层可靠性是纸糊的：源图整张存 dataURL，几张大图就顶满 5 MB 配额且失败无声（A1）；恢复过程没有 catch，一张坏图就中断（A2）

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
3. **曲线拉伸**（v0.5 现行做法）：路径每 1.5 px 采样一点，沿路径每 `STAMP_STEP = 0.4 px` 盖一个 `W × STAMP_H(2.0) px` 的 midRow stamp，`drawImage + ctx.rotate(切线方向)`，相邻 stamp 重叠 1.6 px 密铺；段内 stamp 起点用累计弧长 `walked` 对齐 STAMP_STEP 整数倍，保证段间不双盖也不漏；急弯外侧留一个平分角方向、高度 `Wd · |tan(Δθ/2)|` 的补丁 stamp；首末端用 `sliced.canvas` 的完整下 / 上半截，各扩 OVERLAP 与中段重叠。**注意：v0.3 / v0.4 的“miter 梯形 + affine 三角形 + clip”写法已被完全废弃**，`drawAffineTri` 函数还留在代码里但没有任何调用点
4. **filter 一次性应用**：羽化 / 色相 / 透明度用 offscreen 中转，避免成千上万个 stamp 每一个都触发 GPU filter

## 不要做的事（避免破坏单文件 demo 的核心）

- ❌ 拆分为多文件
- ❌ 加构建工具 / 包管理
- ❌ 加后端
- ❌ 改公开 URL 路径
- ❌ 在 main 之外开分支（直接 commit 到 main）

## 文件清单

磁盘实况（2026-08-22 清点，`git ls-files` 共 8 个受版本管理的文件，无 `docs/`、无子模块、无依赖）：

- `index.html` — 主程序（HTML+CSS+JS 全在一个文件，**1330 行**）
- `README.md` — 公开门面
- `progress.md` — 本文件
- `BUGS.md` — bug 历史档案 + 已知问题清单
- `CLAUDE.md` — 项目级 Claude 指引
- `LICENSE` — MIT
- `.gitignore`
- `.claude/settings.json` — Claude Code 项目级配置（只放行 git / gh / 打开 index.html 几条）

## 下一步（按优先级）

**先修 bug，再加功能**——BUGS.md 的“已知问题”一节里 15 条都还没动，其中前三条建议优先：

1. **A1** `persist()` 的 localStorage 写入失败被空 catch 吞掉 → 至少给用户一条提示（index.html:1234）
2. **A2** `tryRestore()` 未捕获 Promise 拒绝 → 单张图坏掉会中断整个恢复（index.html:1248）
3. **A3** 末端收尖时转角补丁 stamp 不跟着收窄 → 笔锋处凸出满宽色块（index.html:868）

功能方向（原有列表，未启动）：

- 笔触压感（鼠标拖动速度 → 粗细变化）
- 多笔同时被擦除（橡皮擦工具）
- 路径平滑（贝塞尔拟合，让手抖路径自动顺滑）
- 主题切换（深色模式）
- 导入图层（SVG / 文本作为笔触轨迹）

## 如何打开

双击 `index.html`，浏览器即开。所有功能纯前端，不需要后端 / 不联网。
