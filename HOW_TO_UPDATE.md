# 如何更新 Denpa 作品集

网站内容和素材已经分开管理。日常更新主要是复制图片或视频，再修改 `src/content/` 中对应的 JSON 文件。

## 修改前

先备份要编辑的 JSON 文件。JSON 使用英文双引号和英文逗号，最后一项后面不要加逗号，文件编码保持 UTF-8。保存后运行：

```powershell
pnpm run check
pnpm run build
```

## 个人介绍与联系方式

编辑 `src/content/profile.json`：

- `tagline`：首页核心句
- `intro`：首页简介
- `about`：关于我的段落
- `experience`：经历
- `services`：可以提供的服务
- `contact`：绿泡泡、小红书、小黑盒和邮箱

## 小说

编辑 `src/content/novels.json`。每篇小说的结构如下：

```json
{
  "slug": "novel-address",
  "title": "小说标题",
  "excerpt": [
    "列表页第一段节选。",
    "列表页第二段节选。"
  ],
  "chapters": [
    {
      "title": "第一章",
      "paragraphs": [
        "第一段正文。",
        "第二段正文。"
      ]
    }
  ]
}
```

- `slug` 只能使用小写英文、数字和连字符，并且不能重复。
- 没有章节名时可以省略章节对象中的 `title`。
- 每个正文段落是 `paragraphs` 数组中的一项。
- 保存并重新构建后会自动生成 `/fiction/slug/`。

## 画作

把处理后的图片放入 `public/media/artworks/`，再编辑 `src/content/artworks.json`：

```json
{
  "id": "art-05",
  "src": "/media/artworks/art-05.webp",
  "width": 1600,
  "height": 1200,
  "orientation": "landscape"
}
```

`orientation` 可使用：

- `landscape`：横幅
- `portrait`：竖幅
- `square`：方形

`width` 和 `height` 填图片真实像素尺寸，网页会据此预留空间，减少加载时的页面跳动。

## 实验短片

把 H.264 编码的 MP4 放入 `public/media/videos/项目目录/`，再编辑 `src/content/videos.json`：

```json
{
  "id": "video-id",
  "title": "视频标题",
  "src": "/media/videos/video-id/video.mp4",
  "width": 1280,
  "height": 720
}
```

视频页只显示真实标题和播放器。

## 游戏

每个游戏使用一个独立目录，例如：

```text
public/media/games/my-game/
├─ cover.webp
├─ image-02.webp
└─ image-03.webp
```

在 `src/content/games.json` 中加入：

```json
{
  "slug": "my-game",
  "title": "游戏名称",
  "images": [
    {
      "src": "/media/games/my-game/cover.webp",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

首页列表使用第一张图，详情页会依次展示 `images` 中的全部图片。

## 首页影像

首页影像文件位于：

```text
public/media/home/hero-video.mp4
```

如需替换，保持相同文件名并使用 H.264 MP4。建议先压缩文件，并确认静音时仍能看懂主要画面。

## 发布前检查

- 确认所有小说、画作、游戏图片和视频都获得公开展示授权。
- 检查所有页面中的真实作品名称和联系方式。
- 在桌面、平板和手机上检查排版。
- 开启系统“减少动态效果”后确认仍可完整阅读和导航。
- 运行 `pnpm run check` 与 `pnpm run build`。
- 将生成的整个 `dist/` 目录上传到 Cloudflare Pages。
