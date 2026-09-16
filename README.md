# ✈️ TripWise · AI出行随身向导

> 为 Trae AI 创造力大赛而作 —— 覆盖全国 52 个热门旅游城市的 AI 旅行规划助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#-技术栈)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](#-技术栈)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)](https://leafletjs.com/)
[![Zhipu AI](https://img.shields.io/badge/AI-智谱GLM--4--Flash-blue)](https://open.bigmodel.cn/)

纯前端实现、零构建、零后端 —— 双击 `index.html` 即可运行。

---

## 📖 项目简介

**TripWise** 是一款智能旅行规划 Web 应用：目的地预选下拉框覆盖全国 **52 个热门旅游城市**（按六大区域分组），精选城市秒出离线路线，其余城市由 **AI 大模型实时生成**带真实坐标的路线图；并内置 **AI 旅行顾问**，通过多轮对话按你的预算、同行人、天数等实际情况量身规划出行。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🗺️ **智能路线规划** | 52 城下拉预选（防错输）；北京/上海/成都/贵阳精选离线路线；其余城市 AI 实时生成，含地图打点、路线连线、时间线、出行贴士、模拟导航 |
| 🤖 **AI 旅行顾问** | 多轮对话式行程规划，自动携带路线页选中城市/天数/偏好上下文；快捷提问、流式加载动画、Markdown 渲染 |
| 🧳 **AI 行李清单** | 按天气、天数、场景（海边/登山/商务/摄影）智能生成，勾选进度条实时统计 |
| 📍 **地标打卡图鉴** | 6 城 36 个地标收集，打卡成就与进度本地持久化 |
| 🎁 **探店盲盒** | 6 城小众好店随机抽取，翻牌动效 |
| 📔 **旅行手账** | 旅途文字一键生成四风格手账（可爱/复古/清新/水墨） |
| 💰 **旅行预算计算器** | 16 城真实消费分级，按人数/天数/住宿餐饮档次估算总预算与费用占比条形图，附省钱贴士 |
| 🗣️ **方言课堂** | 10 城常用方言短句（含拼音、释义、例句）+ 随机小测试，和当地人更亲近 |
| 📸 **旅行记忆墙** | 时间线式记录旅途瞬间（标题/地点/心情/正文），localStorage 本地持久化，内容自动转义防注入 |
| 🌤️ **天气助手** | 16 城季节气候参考与穿衣建议，行前心里有数 |
| 🎯 **城市冷知识** | 16 城趣味问答题库，出发前先了解这座城市 |

## 🚀 快速开始

### 1. 获取代码

```bash
git clone https://github.com/HanJiang-GuiYang/TripWise.git
cd TripWise
```

### 2. 配置 AI 密钥（一次性）

```bash
cp config.example.js config.js   # Windows: copy config.example.js config.js
```

打开 `config.js`，填入你的免费 API Key：

- **智谱 AI（默认，推荐）**：注册 [open.bigmodel.cn](https://open.bigmodel.cn)（手机号+实名认证）→ 控制台「API Keys」→ 新建并复制。`glm-4-flash` **永久免费**
- **硅基流动（备选）**：注册 [cloud.siliconflow.cn](https://cloud.siliconflow.cn) → 账户管理 → API 密钥，注册送 2000 万 token

> 🔒 `config.js` 已被 `.gitignore` 忽略，密钥只保存在你本地浏览器直连官方 API，不经过任何第三方服务器。

### 3. 运行

直接用浏览器打开 `index.html`（或 `python -m http.server 8000` 后访问 `http://localhost:8000`）。

未配置密钥时应用仍可完整体验：精选城市路线、行李清单、地标打卡、盲盒、手账、预算计算器、方言课堂、记忆墙、天气助手、城市冷知识；AI 功能会给出友好引导。

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JavaScript（无框架、无构建工具）
- **地图**：[Leaflet 1.9.4](https://leafletjs.com/) + 高德瓦片（国内加载快）
- **AI**：智谱 GLM-4-Flash / 硅基流动（OpenAI 兼容 Chat Completions 协议，浏览器 CORS 直连）
- **存储**：localStorage（打卡进度、AI 配置说明见 `config.js`）

## 📁 目录结构

```
TripWise/
├── index.html          # 页面入口（11 大功能模块）
├── app.js              # 全部业务逻辑（城市数据/路线生成/聊天/地图/预算/方言/记忆墙等）
├── style.css           # 紫粉渐变主题样式
├── config.js           # ★ AI 配置中心（本地私有，不入库）
├── config.example.js   # 配置模板（入库）
├── README.md
└── LICENSE
```

## ⚙️ 配置项说明（config.js）

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `provider` | 模型提供商 `zhipu` / `siliconflow` | `zhipu` |
| `apiKey` | 平台 API Key | — |
| `models` | 各提供商模型名，可换平台支持的任意模型 | `glm-4-flash` |
| `temperature` | 随机性 0~1 | `0.8` |
| `maxTokens` | 单次回复最大长度 | `1500` |

## 🧠 AI 路线生成原理

精选城市直接渲染内置路线；其余城市向大模型发送结构化提示词，要求返回

```json
[{"time":"09:00","title":"兵马俑","lat":34.38,"lng":109.27,"icon":"🏛️","transport":"旅游专线"}]
```

前端解析后校验坐标（偏离城市中心自动修正回市区），复用统一渲染管线；解析失败降级为纯文本展示，保证永不白屏。

## 📝 开源协议

[MIT](LICENSE) © 2026 HanJiang-GuiYang

---

<p align="center">Made with ❤️ for Trae AI 创造力大赛</p>
