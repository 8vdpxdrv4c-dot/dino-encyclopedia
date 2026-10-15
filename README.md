# 远古森语 · 恐龙百科（Dinosaur Encyclopedia 3D）

一个以 **three.js 全屏交互式 3D 地球** 为核心的中文恐龙百科网站，采用「暗黑森系」视觉风格：深绿与墨黑、苔藓与雾气、琥珀色光晕与萤火虫粒子、优雅的中文衬线字体。

**在线访问：** https://8vdpxdrv4c-dot.github.io/dino-encyclopedia/

![首页 · 中国化石产地](docs/screens/home_imgmarkers_zoom.jpg)

## 功能

- **全屏 3D 地球**：拖动旋转、滚轮缩放；每个化石产地以圆角恐龙缩略图标记，并以引线连接到真实产地。
- **无重叠标签布局**：每帧在屏幕空间对标记进行聚类，按地质年代与拉丁名稳定排序，以网格依次展开；与界面面板避让，保证卡片互不重叠；远景下密集区域显示「N 处化石」计数徽章，点击即放大展开。
- **地质年代轴**：晚三叠世、早/中/晚侏罗世、早/晚白垩世（附百万年范围），拖动即可筛选地球上的恐龙。
- **侧边名录抽屉**：搜索（中文名 / 拉丁名 / 产地），按类群、食性、地区筛选。
- **滑入式预览面板**：点击标记即可在不离开地球的情况下查看要点，并可进入完整档案页。
- **分类浏览**：兽脚类、蜥脚形类、角龙类、剑龙类、甲龙类、鸟脚类、肿头龙类等。
- **详情页**：中文名与拉丁名、年代、体长、体重、食性、发现地与命名年份、简介、趣闻；6 种恐龙提供可旋转的 3D 模型（GLB）。
- **85 种恐龙**，其中 28 种为中国发现（禄丰龙、马门溪龙、永川龙、中华龙鸟、小盗龙、羽暴龙、近鸟龙等）。
- 响应式设计，移动端抽屉与面板自动变为底部弹出层；构建后完全离线可用。

![预览面板](docs/screens/v6_1440x900_spinosaurus.jpg)

| 3D 模型详情页 | 移动端 |
|---|---|
| ![详情](docs/screens/detail.jpg) | ![移动端](docs/screens/v6_390x844_spinosaurus.jpg) |

## 运行与构建

需要 Node.js 18+（推荐 20）。

```bash
npm install
npm run dev       # 本地开发
npm run build     # 生成 dist/
npm run preview   # 在 http://localhost:4178 预览构建结果
```

`vite.config.js` 使用相对路径（`base: './'`），`dist/` 可部署到任意静态托管的任意子路径。推送到 `main` 分支后，GitHub Actions（`.github/workflows/pages.yml`）会自动构建并发布到 GitHub Pages。

## 目录结构

```
index.html            页面骨架
src/main.js           地球、标签布局、时间轴、路由、详情与 3D 模型查看器
src/data.js           恐龙数据（85 种）
src/images.json       图片来源、作者与许可信息
src/credits.js        模型、纹理、字体来源
src/style.css         暗黑森系样式
public/models/        GLB 模型
public/img/, thumb/   恐龙图片（WebP）与 128px 缩略图
public/tex/           地球纹理与子集化字体
fetchimg.mjs          从维基共享资源下载图片并记录许可的脚本
*_test.cjs, shot*.cjs Playwright 无头浏览器测试 / 截图脚本
```

## 数据说明

物种数据（年代、体长、体重、产地、命名年份）整理自维基百科及其引用文献，数值为常见估计，不同研究之间可能存在差异。地球上的大陆为**现代位置**示意，并非中生代古地理复原；标记位于化石的现代产地坐标。

## 素材来源与许可

| 素材 | 来源 | 许可 |
|---|---|---|
| 3D 模型（霸王龙、伶盗龙、三角龙、副栉龙、剑龙、迷惑龙） | Quaternius，经 [Poly Pizza](https://poly.pizza) | CC0 1.0 |
| 恐龙图片（83 张） | [Wikimedia Commons](https://commons.wikimedia.org)，逐张作者与许可见站内「版权与来源」页及 `src/images.json` | CC BY / CC BY-SA / CC0 / 公有领域（各图不同） |
| 地球纹理 | [NASA Visible Earth – Blue Marble](https://visibleearth.nasa.gov/images/57752) | NASA 公有领域 |
| 字体 Noto Serif SC（按用字子集化） | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) | SIL OFL 1.1 |
| three.js | [threejs.org](https://threejs.org) | MIT |

使用 CC BY-SA 图片时请保留署名并遵循相同方式共享条款。本项目自身代码以 MIT 许可发布。
