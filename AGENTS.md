# LoongUnArch 项目

## 项目概述
基于 Tauri 框架开发的桌面解压缩工具，支持 rar、zip 等常见压缩格式的文件浏览和解压功能。

## 技术栈
- **前端**：Vue 3 + TypeScript + Vite + Vuetify
- **后端**：Tauri (Rust)
- **包管理器**：pnpm
- **测试**：Jest

## 目录结构
```
/workspace/projects
├── src/                    # 前端 Vue 源码
│   ├── components/         # Vue 组件
│   ├── utils/              # 工具函数
│   └── main.ts             # 前端入口
├── src-tauri/              # Tauri 后端 (Rust)
│   └── src/main.rs         # Rust 后端入口
├── test/                   # 测试文件
├── index.html              # HTML 入口
├── package.json            # 前端依赖
├── vite.config.ts          # Vite 配置
└── tauri.conf.json         # Tauri 配置
```

## 关键入口 / 核心模块
- **前端开发**：`pnpm dev`（Vite 开发服务器）
- **后端开发**：`pnpm tauri dev`（Tauri 开发模式）
- **生产构建**：`pnpm build`（前端）+ `pnpm tauri build`（完整打包）
- **前端测试**：`pnpm test`

## 运行与预览
- **桌面应用**：不支持 Web 预览，需通过 `pnpm tauri dev` 启动开发模式
- **前端独立预览**：`pnpm dev`（仅前端部分）

## 用户偏好与长期约束
- 使用 pnpm 管理依赖（禁止 npm/yarn）
- Rust 版本由 Tauri CLI 管理

## 常见问题和预防
- 确保 Node.js >= 18 和 Rust 已安装
- Windows 平台使用 `explorer /select,` 打开文件夹
- macOS 平台使用 `open -R` 打开文件夹

## 依赖版本（2024-06 更新）

### 已升级
| 包 | 原版本 | 新版本 | 说明 |
|---|---|---|---|
| vue | 3.3.4 | 3.5.33 | defineModel 已是内置宏 |
| vue-tsc | 1.8.5 | 3.2.7 | 配合 Vue 3.5 |
| vite | 5.0.0 | 6.3.5 | 大版本升级 |
| @vitejs/plugin-vue | 4.2.3 | 5.2.3 | 配合 Vite 6 |
| typescript | 5.0.2 | 5.8.3 | 升级到 5.x |
| dayjs | 1.11.10 | 1.11.20 | 小版本升级 |
| jest | 29.7.0 | 30.3.0 | 测试框架升级 |
| ts-jest | 29.1.2 | 29.4.9 | 配合 Jest 30 |

### 注意事项
- vue3-tree-vue 类型定义不完整，已添加本地类型声明 `src/vue3-tree-vue.d.ts`
- jest.config.js 已重命名为 jest.config.cjs（ESM 兼容性）
- defineModel 不再需要从 vue 导入（Vue 3.4+ 内置宏）
