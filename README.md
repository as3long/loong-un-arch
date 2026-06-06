# LoongUnArch

一个基于 Tauri + Vue 3 + Vuetify 的 ZIP / RAR 压缩文件预览与解压小工具。

## 功能

- 打开或拖拽 ZIP / RAR 文件并预览目录结构
- 选择目标目录后解压文件
- 解压完成后可一键打开输出目录
- 支持明 / 暗主题切换

## 更新

- 2024-06-13 增加打开解压文件夹的功能
- 2024-06-21 修复大写后缀名不显示 icon、中文文件夹双击打不开压缩文件的问题
- 2026-06-06 升级前端与 Tauri v1 兼容依赖，优化 Vuetify 应用栏、拖拽提示、加载状态、文件树、Snackbar 与窗口配置
- 2026-06-06 优化 GitHub Actions 发布流程：增加 Release 写权限、启用 pnpm 缓存，并使用 frozen lockfile 安装依赖