# ✈️ TripWise · 旅行规划随身向导

> 纯前端旅行工作台 —— 路线规划、AI 顾问、预算、行李、地标、探店与旅行记忆，一个页面搞定。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#-技术栈)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](#-技术栈)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)](https://leafletjs.com/)

**零构建、零后端、双击 `index.html` 即可运行**。开发者可以配置自己的 AI API Key 启用实时路线生成与 AI 顾问；未配置时精选城市路线与内置功能完整可用。

---

## 📖 项目简介

TripWise 是一款面向中文自由行者的浏览器端旅行规划工具。目的地预选覆盖 **全国 52 个热门旅游城市**（按六大区域分组），北京、上海、成都、贵阳提供精选 **7 天离线行程**，其余城市由 AI 大模型按需生成带真实坐标的路线图。内置 AI 旅行顾问，可按预算、同行人、天数等实际情况多轮对话量身规划。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🗺️ **智能路线规划** | 52 城下拉预选；北京/上海/成都/贵阳精选 7 天离线路线（按所选天数自动取用）；其余城市 AI 实时生成，含地图打点、路线连线、时间线、出行贴士、模拟导航 |
| 🤖 **AI 旅行顾问** | 多轮对话式行程规划，自动携带路线页选中城市/天数/偏好上下文；快捷提问、流式加载、Markdown 渲染 |
| 🧳 **AI 行李清单** | 按天气、天数、场景（海边/登山/商务/摄影）智能生成，勾选进度条实时统计 |
| 📍 **地标打卡图鉴** | 6 城 36 个地标收集，打卡成就与进度本地持久化 |
| 🎁 **探店盲盒** | 6 城小众好店随机抽取，翻牌动效 |
| 📔 **旅行手账** | 旅途文字一键生成四风格手账（可爱/复古/清新/水墨） |
| 💰 **旅行预算计算器** | 16 城真实消费分级，按人数/天数/住宿餐饮档次估算总预算与费用占比条形图，附省钱贴士 |
| 🗣️ **方言课堂** | 10 城常用方言短句（含拼音、释义、例句）+ 随机小测试 |
| 📸 **旅行记忆墙** | 时间线式记录旅途瞬间，localStorage 本地持久化，内容自动转义防注入 |
| 🌤️ **天气助手** | 16 城季节气候参考与穿衣建议 |
| 🎯 **城市冷知识** | 16 城趣味问答题库，出发前先了解这座城市 |

## 🚀 快速开始

```bash
git clone https://github.com/HanJiang-GuiYang/TripWise.git
cd TripWise
```

直接用浏览器打开 `index.html` 即可。推荐用 `python -m http.server 8000` 或 VS Code Live Server，避免部分浏览器对 file:// 的 CORS 限制。

### 配置 AI（可选）

```bash
copy config.example.js config.js    # Windows
cp config.example.js config.js      # macOS / Linux
```

打开 `config.js` 填入 API Key：

- **智谱 AI（推荐）**：[open.bigmodel.cn](https://open.bigmodel.cn) 注册后控制台新建 API Key，`glm-4-flash` 永久免费
- **硅基流动（备选）**：[cloud.siliconflow.cn](https://cloud.siliconflow.cn) 注册送 2000 万 token

> 🔒 `config.js` 已被 `.gitignore` 忽略，密钥只保存在本地浏览器直连官方 API，不经过任何服务器。

未配置时应用完整可用：精选城市路线、行李清单、地标打卡、盲盒、手账、预算计算器、方言课堂、记忆墙、天气助手、城市冷知识。

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JavaScript（IIFE 全局命名空间，无框架、无构建工具、零依赖）
- **地图**：[Leaflet 1.9.4](https://leafletjs.com/) + 高德瓦片（GCJ-02 火星坐标系，国内加载快）
- **AI**：智谱 GLM-4-Flash / 硅基流动，OpenAI 兼容 Chat Completions 协议，浏览器 CORS 直连
- **存储**：localStorage（打卡进度、AI 配置说明见 `config.js`）

## 📁 目录结构

```
TripWise/
├── index.html          # 页面入口（11 大功能模块）
├── app.js              # 业务逻辑：AI 路线生成、地图渲染、预算、方言、记忆墙等
├── data.js             # 52 城市与 4 城 7 日离线行程数据（GCJ-02 坐标）
├── v2.js               # UI 层：标签页切换、偏好恢复、深色模式、英雄图加载
├── v2.css              # Apple 风格样式
├── style.css           # 旧版样式（兼容保留）
├── icons.js            # Emoji → SVG 图标映射
├── utils.js            # 通用工具函数（存储、转义、随机打乱等）
├── config.example.js   # AI 配置模板（入库）
├── assets/             # 静态资源（背景图、版权声明）
├── DESIGN.md           # 设计说明
├── PRODUCT.md          # 产品定位
├── README.md
└── LICENSE
```

## 🧠 AI 路线生成原理

精选城市直接渲染内置 7 日路线；其余城市向大模型发送结构化提示词，要求返回：

```json
[{"time":"09:00","title":"兵马俑","lat":34.38,"lng":109.27,"icon":"🏛️","transport":"旅游专线"}]
```

前端解析后校验坐标（偏离城市中心自动修正回市区），复用统一渲染管线；解析失败降级为纯文本展示，保证永不白屏。

## 🤝 开发方式说明

TripWise 由 **HanJiang-GuiYang** 独立完成产品定义、需求决策与最终验收，**Trae AI 编程助手** 作为协作方参与工程实现、问题排查与数据整理。AI 深度参与的提交会以 `Co-authored-by: Trae AI` 署名。

协作分工大致如下：

| 事项 | 主要负责方 |
|------|-----------|
| 产品方向、功能取舍、验收 | HanJiang-GuiYang |
| 界面与交互实现、架构重构、Bug 修复 | Trae AI 编程助手 |
| 离线城市数据扩充、景点坐标核对 | 双方协作（AI 查询 + 开发者确认） |
| 文档、技术说明 | 双方协作 |

项目所有代码与数据均经开发者审阅、调试后合入；第三方资源（地图瓦片、图片等）版权归原作者所有，详见 [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md)。

## 📝 开源协议

[MIT](LICENSE) © 2026 HanJiang-GuiYang
