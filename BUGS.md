# BUGS · 切片拉伸笔刷

> 本文件分两段：上面是**已知问题**（盘出来但还没修，按严重度排），下面是**历史档**（已修，倒序，最新在最上）。每条 ≤ 10 行。

---

# 已知问题（未修）

2026-08-22 通读 `index.html` 全部 1330 行盘出，均为**当前代码就存在**的缺陷，行号对应 2026-05-20 的 v0.5 版本（`71a0fa3`）。⚠️ 全部只做了静态阅读判断，**没有实跑复现**。

## 2026-10-22 — App审计修复
- 症状/根因与修法：EX-07/08：自动保存失败明确提示；损坏图逐张跳过并恢复好图，过滤丢失笔刷相关笔画，恢复期间不写回原存档。
- 文件：index.html
- 验证：模拟配额失败/成功、单图损坏与部分恢复回归通过；浏览器视觉未验。
- 状态：本地已修改，未部署；已独立审查并修复旧格式笔画兼容回归，原main提交。

## A1 — 自动保存撑爆配额后静默丢档（严重）
- **症状**：加载几张大图后继续画，刷新页面工作全没了，页面上事先没有任何警告
- **根因**：`persist()` 把每张 brush 的源图整张 `toDataURL()` 存进 localStorage。`toDataURL()` 不带参数时**一律重新编码成无损 PNG**，传进来的照片型 JPG 会因此涨好几倍，base64 再加约 33%——几张图就顶满浏览器 5 MB 配额。而 `catch (e) {}` 是个只有注释的空 catch，`QuotaExceededError` 被完全吞掉，之后每次 `persist()` 都在无声失败
- **建议修法**：catch 里至少调 `setStatus('warn', …)` 提示“自动保存已停止，请手动导出”；进一步可只存缩略图或改用 IndexedDB
- **文件**：[index.html](index.html) line 1217-1237（空 catch 在 1234-1236）、`srcToDataURL` line 1207

## A2 — 恢复时单张图坏掉会中断整个恢复流程（严重）
- **症状**：localStorage 里某个 `srcData` 损坏或截断时，页面加载后图片库空白、画布空白，控制台一条未捕获的 Promise 拒绝，用户看不出发生了什么
- **根因**：`tryRestore()` 是 `async` 且只有 `try/finally` **没有 catch**；循环里 `await loadImageFromDataURL(b.srcData)` 一旦 reject 就直接抛出，此时部分 brush 已经 push 进 `state.brushes`，但 `renderBrushList()` / `paint()` 都还没执行 → 内部有数据、界面上没有。启动处 line 1327 的 `tryRestore();` 也没接 `.catch()`
- **建议修法**：单张图的 await 各自 try/catch 跳过坏图并计数，函数整体再包一层 catch 兜底
- **文件**：[index.html](index.html) line 1248-1320、调用点 line 1327

## A3 — 末端收尖遇急弯，笔锋处凸出一块满宽色块
- **症状**：勾选“末端收尖”后画一条末尾带转弯的曲线，本该越来越细的笔锋处冒出一块原始粗细的色块
- **根因**：taper 的 smoothstep 衰减只作用在中段 stamp 循环里（line 843-854），而段间 round-join 补丁是**独立的第二个循环**，全程用未衰减的 `Wd` / `halfW`，也完全不看 `taper` 参数
- **建议修法**：补丁循环里按同一条弧长 → smoothstep 曲线算出该点的 `stampWd`，宽度小于 0.5 时跳过
- **文件**：[index.html](index.html) line 866-886（满宽绘制在 line 884）

## A4 — 路径近 180° 回折时补丁 stamp 高度爆炸
- **症状**：快速甩动鼠标画出一个接近原地折返的尖角时，画面上出现一条穿出画布的超长条带
- **根因**：补丁高度取 `Wd · |tan(Δθ/2)|`，`Δθ` 趋近 ±π 时 `tan` 发散。现有两道闸都拦不住这一档：`Math.hypot(bx, by) < 0.01` 只在**恰好** 180° 时成立，`|dAng| < 0.04` 管的是另一头。取 Δθ = 172° 实算，平分角向量长度约 0.14 越过闸门，而 `tan(86°) ≈ 14.1`，粗细拉到 300% 时 stamp 高度可达一万多像素
- **建议修法**：给 stampH 加一个上限（例如 `Math.min(stampH, Wd * 4)`），或把 `|dAng|` 超过某阈值的点直接当断笔处理
- **文件**：[index.html](index.html) line 874-879

## A5 — `[` `]` 与 `Ctrl+Z` 在输入框里也被劫持
- **症状**：光标在“画布宽 / 高”输入框里时按 `Ctrl+Z` 撤销不了刚打的字，反而撤掉了画布上的一笔
- **根因**：`keydown` 监听挂在 `window` 上，全程不判断 `e.target` 是不是 `input`，还统一 `preventDefault()`
- **建议修法**：函数开头加一条 `if (e.target.matches('input, textarea')) return;`
- **文件**：[index.html](index.html) line 1049-1061

## A6 — 鼠标移出画布这一笔立刻落定
- **症状**：画长笔画时不小心划出画布边界，笔画当场提交，移回来只能重新起一笔
- **根因**：`mouseleave` 直接调 `endStroke()`。设计上是为了防止鼠标在画布外松开导致笔画悬空，但代价是误触率高
- **建议修法**：改成在 `window` 上监听 `mouseup` 来收笔，`mouseleave` 只暂停预览不提交
- **文件**：[index.html](index.html) line 1025-1028

## A7 — 触屏未处理 `touchcancel`
- **症状**：手机上画到一半来电话或触发系统手势，回到页面后这一笔既没提交也擦不掉，`state.currentStroke` 一直挂着
- **根因**：只注册了 `touchstart` / `touchmove` / `touchend` 三个事件，浏览器打断手势时派发的 `touchcancel` 没有对应处理；另外三个处理器都只读 `e.touches[0]`，多指同时按下的行为未定义
- **建议修法**：`touchcancel` 复用 `touchend` 的处理路径
- **文件**：[index.html](index.html) line 1030-1044

## A8 — 画布尺寸输入非法值时完全没有反馈
- **症状**：宽度框留空或填 `50` 后点“应用”，画面纹丝不动也不报错；填 `9999` 则画布变成 4096 但输入框仍显示 9999
- **根因**：`parseInt('')` 得 NaN，`NaN >= 200` 为 false，整个分支被静默跳过；`resizeCanvases()` 内部虽然 clamp 到 200~4096，但 clamp 后的值不回写输入框
- **建议修法**：非法值给一条 `setStatus('warn', …)`；clamp 后把实际值写回两个输入框
- **文件**：[index.html](index.html) line 1110-1117、clamp 在 line 966-968

## A9 — 重新定义切割线后，缩略图状态与实际状态不一致
- **症状**：点了“在原图上拖一条线 ↘”但没真的拖，此时到画布上画会被拦下提示“请先定义切割线”，可缩略图上并没有出现表示未定义的橙色小点
- **根因**：`btnCut` 的处理器把 `state.sliced` 置空，却没同步清掉 `brush.sliced`；而缩略图的橙点判据读的是 `b.sliced`，两处状态源不一致
- **建议修法**：置空 `state.sliced` 时同步清 `brush.sliced` 并重绘列表；或者干脆只保留 `brush.sliced` 一个事实源
- **文件**：[index.html](index.html) line 570-578（置空在 575）、橙点判据 line 477-481

## A10 — 缩略图每次刷新列表都重新编码一遍
- **症状**：图片库里图一多，切换 brush、定义切割线、删除都会明显卡一下
- **根因**：`renderBrushList()` 对每个 brush 都调 `brushThumbnail()`，后者每次新建 56×56 canvas 并 `toDataURL()`；而 `renderBrushList()` 在 `acceptSource` / `switchBrush` / `deleteBrush` / `prepareSlicedImage` 四处都会触发，`toDataURL` 是同步 PNG 编码
- **建议修法**：把 dataURL 缓存到 brush 对象上，只在源图变化时重算
- **文件**：[index.html](index.html) line 493-503、调用点 line 467-491

## A11 — 曲线实时预览随笔画变长而越来越卡
- **症状**：一笔画得越长，跟手感越差，末尾明显掉帧
- **根因**：`mousemove` 每收一个点就调 `paint()`，`paint()` 会把**当前整条路径**的全部 stamp 重画一遍。BUGS 历史档里记的“1000 px 路径约 2500 个 stamp、30 ms”是单次渲染的成本，而预览是每帧付一次，总开销随路径长度呈平方增长
- **建议修法**：预览时只增量绘制新增的那一小段，或对预览降采样（提高 STAMP_STEP）
- **文件**：[index.html](index.html) line 1003-1014、`paint()` line 954-964

## A12 — 从 localStorage 读回的 `strokes` 未做结构校验
- **症状**：手改过 localStorage 或跨版本格式变动时，页面加载即抛 TypeError，画布卡在空白
- **根因**：只用 `Array.isArray(data.strokes)` 判断了最外层是数组，元素内部的 `path` 是否存在、是否为数组、点是否有 x / y 一概不查，而 `drawStroke` 直接读 `stroke.path.length`
- **建议修法**：还原时过滤掉 `path` 不是非空数组的项
- **文件**：[index.html](index.html) line 1294、`drawStroke` line 901-925

## A13 — 死代码三处
- **`drawAffineTri`**（约 30 行）：v0.3 / v0.4 的曲线渲染主力，v0.5 换 stamp brush 后**全文件零调用点**。CLAUDE.md 写的是“保留作工具（未来可能用）”——留可以，但它带着已被判定为错误方案的 `ctx.clip()` 用法，容易被后来者当成可用范式抄走，建议至少在函数头注明“已废弃，勿在曲线渲染中复用”
- **`startSegLen`**：`drawCurvedStretch` 里算出来后从未被读取
- **`acceptSource(imgOrCanvas, name)` 的 `name` 参数**：两个调用点都只传一个实参，第二参永远是 undefined，名字始终走 `'图 N'` 兜底
- **文件**：[index.html](index.html) line 746-777、line 812、line 404

## A14 — 号称支持移动端，但页面根本没做移动端
- **症状**：手机上打开线上页面，整页被缩到极小，侧栏和画布挤成一团，滑杆点不中
- **根因**：`<head>` 里**只有 `<meta charset>`，没有 `<meta name="viewport">`**，移动浏览器于是按 980 px 虚拟宽度渲染再整体缩放；CSS 里 `@media` 查询数量为 0，布局是写死的 `#app { display:flex; max-width:1600px }` + `#sidebar { width:320px }`，在窄屏上不会折行。触屏**事件**确实做了（touchstart / touchmove / touchend 转成合成 MouseEvent），但**版式**一点没做——README 此前那句“✅ 触屏支持”只说对了一半
- **建议修法**：加 `<meta name="viewport" content="width=device-width, initial-scale=1">`，再补一条窄屏媒体查询让 `#app` 改成纵向堆叠；给两个 canvas 加 `touch-action: none` 免得手势和页面滚动打架
- **文件**：[index.html](index.html) line 3-5（head）、line 36-38（布局）、line 1030-1044（触屏事件）

## A15 — `.claude/settings.json` 里那条 curl 白名单开口过宽
- **症状**：无用户可见症状，属配置层面的口子
- **根因**：允许项写的是 `Bash(curl -s -o /dev/null -w * https://appapp777.github.io/slice-stretch-brush/)`，中间那个 `*` 是通配符而不是字面的格式串。凡是以这段前缀开头、以这个 URL 结尾的命令都能匹配上，中间塞进别的东西也照样放行——本意只是想放行一条探活命令，实际放宽了不少
- **建议修法**：把 `-w` 的参数写死（例如 `-w "%{http_code}"`），或者干脆删掉这一条，需要探活时临时授权
- **文件**：[.claude/settings.json](.claude/settings.json) line 14

---

# 历史档（已修）

## 2026-05-20 — 曲线笔触仍能看到细缝（v0.4 OVERLAP 也没根治）
- **症状**：v0.4 加了 0.75 px 段间 OVERLAP，肉眼仍能看见笔触身上断断续续的极细白缝
- **根因**：OVERLAP 只能扩 dest 几何边界，但**clip path 本身就是 1-bit 栅格化**——浮点坐标四舍五入到不同像素让相邻段的 clip 边在 sub-pixel 上漏出。无论 OVERLAP 多大，clip 边的 1-bit 误差永远存在，只是位置变了
- **修法**：彻底放弃 `ctx.clip() + affine triangle`，曲线渲染改 **stamp brush**：沿 path 每 0.4 px 一个 `W × 2.0 px` 矩形 stamp，`drawImage(midRow, ..., -halfW, -STAMP_H/2, Wd, STAMP_H) + ctx.rotate(切线方向)`。相邻 stamp 沿切线方向重叠 1.6 px，密铺无空隙；**没有 clip，没有 affine 边界 → 没有任何栅格化误差**
- **副作用**：性能 ~2500 stamps / 笔（1000 px path），约 30 ms 渲染——可接受
- **文件**：[index.html](index.html) `drawCurvedStretch` 整段重写

## 2026-05-20 — 曲线笔触密集白色细缝（v0.3 affine quad 仍未根治）
- **症状**：v0.3 用 affine quad 渲染后，肉眼看仍有密集的白色垂直细缝沿笔触横截面方向遍布全身；笔触越粗越明显（截图显示棕色“蛇”身上几十条 1~2 px 白缝）
- **根因**：每段独立 `ctx.clip(梯形) + setTransform + drawImage`，相邻段的 clip path 在公共边上是 **1-bit 栅格化**——浮点坐标四舍五入到不同像素 → 段 i 的远端 clip 边和段 i+1 的近端 clip 边各漏 0.5~1 px → 公共边两侧背景透出 → 白色细缝
- **修法**：每段沿 segment 方向各扩 0.75 px（OVERLAP）→ 相邻段 1.5 px 重叠 → 吃掉栅格化误差；下半截/上半截 stamp 同样扩 OVERLAP 与首/末段重叠；直线模式 3 段间也同步加 OVERLAP
- **副作用**：source mapping 不变，dest 沿 path 方向被拉长 1.5 px → 由于 source 是 1 像素中行（沿 path 方向无变化），视觉无影响
- **文件**：[index.html](index.html) `drawCurvedStretch` + `drawStretchedShape` 内 `OVERLAP = 0.75` 常量

## 2026-05-20 — 曲线笔触仍然“断”（v0.2 的补丁不够彻底）
- **症状**：v0.2 的 round-join 补丁理论上盖住外侧楔形 gap，但用户仍能看见“稀缝”
- **根因**：v0.2 是“每段矩形 stamp + cur 处补丁”，相邻段端点用不同方向短边相接 → 切割线那一行像素两端列 alpha < 100%（抗锯齿）→ 公共边叠加只到 75% → 看起来稀缝。补丁也是矩形同样问题
- **修法**：彻底换 affine quad strip 算法（v0.3）—— 相邻段共享 `path[i] ± perp[i]` 端点，几何上严丝合缝，无 alpha 叠加
- **后续**：v0.3 修了 alpha 叠加但暴露了 clip 栅格化的新缝（见上一条）
- **文件**：[index.html](index.html) `drawAffineTri` + 重写的 `drawCurvedStretch`

## 2026-05-19 — 曲线笔刷转弯处断裂
- **症状**：曲线模式画弧线、转弯，外侧出现明显空白缝；笔触越粗、转弯越急越明显
- **根因**：每段中行用自段切线做旋转，相邻段在公共端点旋转方向不同 → 外侧缝隙 ≈ `(Wd/2)·tan(Δθ/2)`，笔触 200px、转弯 30° 时缝隙达 27px
- **修法**：每个内部 path 点加平分角方向中行 stamp（圆角接头），高度 `Wd·tan(|Δθ|/2)`；采样从 2.5px 缩到 1.5px
- **后续**：2026-05-20 发现仍有 alpha 叠加问题，v0.3 重写为 affine quad；v0.4 再用 OVERLAP 修栅格化缝
- **文件**：[index.html](index.html) — 已被 v0.3 删除
