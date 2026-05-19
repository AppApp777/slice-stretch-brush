# 切片拉伸笔刷 · Slice-Stretch Brush

> 把一张图（推荐透明底 PNG）从**任意角度**切一刀，再拖动上半截**拉伸成胶囊**——或者沿鼠标轨迹**弯曲当笔刷**写字画画。

**🍎 在线试玩** → **<https://appapp777.github.io/slice-stretch-brush/>**

![single-file](https://img.shields.io/badge/single--file-blueviolet) ![no-build](https://img.shields.io/badge/no--build-success) ![no-backend](https://img.shields.io/badge/no--backend-success) ![mit](https://img.shields.io/badge/license-MIT-blue)

---

## 灵感来源

某天画了张草图，问 AI："苹果横切一刀，拖着上半截走，中间能不能像橡皮泥一样拉长？" 写了半天，发现不仅能拉成胶囊，**沿轨迹弯曲就成了能写字的笔刷**——苹果做的笔，写出来的字还是苹果味的。

---

## 玩法

| 步骤 | 操作 |
|---|---|
| ① 加载图片 | 点「选择 PNG / JPG」上传，或点「用示例苹果」立即试玩 |
| ② 定义切割线 | 点「在原图上点两点」，然后在左侧小预览图上点两下，任意角度 |
| ③ 直线拉伸 | 在右侧大画布**鼠标拖拽**——上半截跟着光标走，中段被拉成胶囊 |
| ④ 曲线写字 | **按住 `Shift` 拖拽**——中段沿鼠标轨迹弯曲，可当笔刷写字 |
| ⑤ 调粗细 | 拖滑杆，或按 `[` / `]` 快捷调 |
| ⑥ 撤销/清屏/导出 | `Ctrl+Z` 撤销 · 「清空画布」清屏 · 「导出 PNG」存透明底图 |

---

## 算法核心（写给好奇的人）

### 切片预渲染
把源图绕**切割中点**旋转 `-cutAngle`，存到一个 `diag × diag` 的内部 canvas（diag = 原图对角线）。**关键不变量**：在这个内部 canvas 里，切割线一定是水平线 `y = diag/2`，之后所有渲染都基于这个不变量。

### 直线拉伸
```
ctx.translate(anchor.x, anchor.y);
ctx.rotate(stretchAngle + π/2);  // 进入局部坐标
// local +Y 永远指向远离 target 的方向
ctx.drawImage(sliced, 0, cutY,  W, botExtent, -Wd/2, 0,           Wd, botExtent*scale);  // 下半截
ctx.drawImage(sliced, 0, cutY,  W, 1,         -Wd/2, -stretchLen, Wd, stretchLen);       // 中段 (1px → 拉伸)
ctx.drawImage(sliced, 0, 0,     W, topExtent, -Wd/2, -stretchLen - topD, Wd, topD);     // 上半截
```

### 曲线拉伸
路径每 2.5 px 采样一点；起点画下半截（沿首段切线），终点画上半截（沿末段切线）；中段每对相邻点画一片 1px 中行，旋转贴合局部切线，`+1px overlap` 防接缝。

### 笔触粗细
横截面 + 上下半截高度按 `scale` 缩放，**中段长度始终等于鼠标拖距**——这样调粗细不会影响「拉多长」的手感。

---

## 技术栈

| | |
|---|---|
| 渲染 | HTML5 Canvas 2D |
| 代码 | 纯前端，单文件 `index.html`（HTML + CSS + JS 全在一个文件） |
| 构建 | 无（不需要 npm / webpack / vite） |
| 后端 | 无（所有处理在浏览器内） |
| 部署 | GitHub Pages 直接托管 |
| 移动端 | ✅ 触屏支持（手指 = 鼠标） |

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

## 待办（按需添加）

- [ ] 切割线橡皮筋预览（拖动定义时实时显示）
- [ ] 多张笔刷源图并存 + 一键切换
- [ ] 曲线模式接缝更平滑（目前 `+1px overlap` 兜底）
- [ ] 透明度滑杆
- [ ] 触屏压力感应（Pointer Events `pressure`）

---

## License

[MIT](LICENSE)
