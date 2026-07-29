# Denpa 数字艺术档案馆

一个使用 Astro、SCSS、GSAP 和 Lenis 构建的原创静态艺术作品集。网站展示小说、绘画、实验短片、游戏、个人经历与可提供的原型开发服务，最终输出为可直接部署到 Cloudflare Pages 的纯静态 `dist/` 目录。

## 页面

- `/`：连续叙事首页与节选作品
- `/fiction/`：三篇小说列表
- `/fiction/[slug]/`：完整小说阅读页，支持明暗主题和阅读进度
- `/artworks/`：四幅画作与键盘可操作的大图查看
- `/videos/`：实验短片
- `/games/`：四个游戏项目
- `/games/[slug]/`：游戏图片画廊
- `/404.html`：静态 404 页面

## 本地运行

需要 Node.js 20 或更新版本。项目使用 pnpm：

```powershell
pnpm install
pnpm run dev
```

浏览器打开终端显示的本地地址，通常是 `http://localhost:4321`。

## 检查与构建

```powershell
pnpm run check
pnpm run build
```

成功后，最终静态文件位于：

```text
dist/
```

## Cloudflare Pages Direct Upload

1. 在 Cloudflare 控制台进入 `Workers & Pages`。
2. 创建 Pages 项目并选择 Direct Upload。
3. 上传构建后的整个 `dist/` 目录。
4. 等待发布完成并访问 Cloudflare 提供的 `*.pages.dev` 地址。

不要上传 `src/`、`node_modules/` 或整个项目根目录。

## GitHub 自动部署

也可以把项目提交到 GitHub，再在 Cloudflare Pages 中连接仓库：

- 构建命令：`pnpm run build`
- 构建输出目录：`dist`
- Node.js：20 或更新版本

本项目没有登录或操作任何线上账号，也没有执行部署。

## 内容维护

内容数据集中在：

```text
src/content/profile.json
src/content/novels.json
src/content/artworks.json
src/content/videos.json
src/content/games.json
```

实际网页素材位于 `public/media/`。更新方法见 [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md)。

## 设计边界

网站研究了 wodniack.dev 的编辑排版和创意开发节奏，但没有复制其源码、素材、文案、页面结构或独特视觉表达。详细记录见 [docs/DESIGN_REFERENCE.md](docs/DESIGN_REFERENCE.md)。
