# 切片拉伸笔刷 · Slice-Stretch Brush

把一张图（推荐透明底 PNG）从任意角度切一刀，再拖动上半截**拉伸成胶囊**——或者沿鼠标轨迹弯曲，**当笔刷写字画画**。

**在线试玩 → https://appapp777.github.io/slice-stretch-brush/**

![demo](https://img.shields.io/badge/single-file-blueviolet) ![](https://img.shields.io/badge/no_backend-yes-success)

## 玩法

1. 加载一张 PNG（或用页面自带的示例苹果）
2. 在原图小预览上**点两个点**定义切割线（任意角度）
3. 在右侧大画布上**鼠标拖拽** → 上半截跟着鼠标走，中段被拉伸
4. **按住 Shift 再拖** → 切到曲线模式，中段沿鼠标轨迹弯曲，可像笔刷写字
5. `[` / `]` 调粗细，`Ctrl+Z` 撤销，点「导出 PNG」存图

## 算法

- **预渲染 sliced canvas**：把源图绕切点旋转 `-cutAngle`，让切割线在内部画布变成水平线。
- **直线拉伸**：`ctx.rotate(stretchAngle + π/2)` 进入局部坐标系；下半截贴 anchor，上半截贴 cursor，中间用 `drawImage` 把 1px 中行缩放到 `stretchLen`。
- **曲线拉伸**：路径每 2.5 px 采样，每段画一片 1px 中行旋转贴合局部切线。
- **粗细**：横截面 + 上下半截高度按 scale 缩放，中段长度保持鼠标拖距。

## 技术栈

纯前端 HTML5 Canvas，单文件 `index.html`，离线可用，零依赖。

## License

MIT
