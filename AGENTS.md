# slice-stretch-brush（切片拉伸笔刷）

> 本仓规则唯一手写源：Codex 直读，Claude Code 经 `CLAUDE.md` 的 `@AGENTS.md` 读。历史、论证、被砍的旧规矩冻结在 [AGENTS-详版.md](AGENTS-详版.md)，不自动装入；AGENTS.md 指到详版某节的，那一节仍有效。

- 纯前端 HTML5 Canvas demo：图像切一刀，上半截拖着走拉成胶囊、沿轨迹弯曲当笔刷。**单文件 `index.html` 就是全部产品**，零依赖、零构建、零后端，GitHub Pages 静态托管。

## 什么事看哪份

- 动手之前先看 [BUGS.md](BUGS.md)「已知问题」：A1~A15 都带行号，别把在册的当新发现，也别在改动里把它们踩深。
- 核心算法（切片预渲染、直线拉伸、v0.5 stamp brush 曲线、多源图笔刷库、笔触属性、自动持久化、画布背景）改之前必读 AGENTS-详版.md『核心算法（改之前必读）』节。
- 状态 [progress.md](progress.md)；公开门面 [README.md](README.md)；项目级 Claude Code 配置 `.claude/settings.json`。
- 线上：<https://appapp777.github.io/slice-stretch-brush/>，只用 `main`，`git push` 后 1~2 分钟 Pages 自动重建，无 CI。commit message 以 `feat:` / `fix:` / `docs:` 起头。

## 别犯的老毛病

- ❌ 不拆单文件、不加构建工具／包管理（npm、webpack、vite、`src/`、`dist/`）、不加后端（任何 fetch／外链资源都违反零依赖承诺）——拆了就破坏「双击即玩」。
- ❌ 不改公开 URL 路径 `/slice-stretch-brush/`，已经在朋友圈传播。
- 改 `index.html` 前先在浏览器打开当前版本确认基线；改完双击跑一遍：加载图 → 切线 → 直线拖 → 曲线拖 → 粗细调 → 撤销 → 导出。
- ⚠️ 持久化那一层是纸糊的（源图整张进 localStorage、写入失败被空 catch 吞掉 A1，`tryRestore()` 没 catch A2）。动持久化相关代码前先把这两条修了，别在流沙上加功能。
- ⚠️ `drawAffineTri` 全文件零调用，是 v0.3／v0.4 的遗物，示范的正是被判定为错误的 `ctx.clip()` 方案——不要当可用范式抄进新代码。
