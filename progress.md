# 切片拉伸笔刷 · progress

## 当前状态：v0.2 已部署 GitHub Pages

**在线试玩**：https://appapp777.github.io/slice-stretch-brush/
**Repo**：https://github.com/AppApp777/slice-stretch-brush（公开）

单文件 HTML（`index.html`），浏览器双击或访问 Pages 即玩。

## 已实现

- 图片加载：本地文件 + 内置示例苹果
- 切割线定义：在原图上点两点（**任意角度**）
- 直线拉伸：上半截贴着光标走，中段 1px 中行拉伸成胶囊
- 曲线拉伸：沿鼠标轨迹弯曲铺设，可像笔刷写字
- 模式切换：按住 `Shift` 即切到曲线模式
- 笔触粗细：滑杆 + `[` / `]` 快捷键调，每笔记录画时的 scale
- 笔刷：鼠标按下 → 抬起为一笔，落到画布永久保留
- 撤销 `Ctrl+Z` / 清空 / 导出透明背景 PNG
- 触屏支持（移动端可用）

## 算法核心

1. **预渲染 sliced canvas**：把源图绕切割中点旋转 `-cutAngle`，使切割线在内部画布中变成水平线 `y = diag/2`。之后所有计算用这个 canvas 当源贴图。
2. **直线拉伸**：`ctx.translate(anchor) + ctx.rotate(stretchAngle + π/2)` 进入局部坐标系，下半截贴在 `+Y` 方向（远离 target），上半截在 `-Y` 方向（target 那侧），中段用 `drawImage` 把 1px 中行缩放到 `stretchLen` 高。
3. **曲线拉伸**：路径每 2.5 px 采样一点，每段画一片 1px 中行旋转贴合局部切线；起点画下半截（首段切线方向），终点画上半截（末段切线方向）。

## 下一步（按用户需求再加）

- 切割线的可视化预览：拖动定义切线时显示橡皮筋直线
- 多张笔刷源图同时存储 + 切换
- 曲线模式接缝处的平滑（目前 `+1px overlap` 兜底）
- 拉伸时让中段保持原图纵横比（而非永远拉伸到 stretchLen）的可选项
- 透明度滑杆
- 撤销栈无限制（目前依赖数组）

## 文件清单

- `index.html` — 主程序（单文件，纯前端，离线可用）
- `progress.md` — 本文件
- `BUGS.md` — 待写入

## 如何打开

直接双击 `index.html`，浏览器即开。所有功能纯前端，不需要后端 / 不联网。
