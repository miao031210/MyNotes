# MyNotes（本地笔记应用）

一个基于 **React + TypeScript + Vite** 的本地笔记应用：以“块（Block）”为基本编辑单元，支持 `/` 命令切换块类型、拖拽排序、撤销/重做，并将数据持久化到浏览器 **localStorage**，实现离线可用与刷新不丢。

## 功能特性

- **多文档管理**：新建 / 切换 / 删除笔记，收藏置顶，侧边栏展示标题与预览
- **块编辑器**：`text / h1 / h2 / h3 / todo / quote / code` 等块类型
- **斜杠菜单**：输入 `/` 打开命令菜单快速切换块类型
- **拖拽排序**：按块进行拖拽调整顺序
- **撤销 / 重做**：快捷键 `Ctrl/⌘+Z`、`Ctrl/⌘+Y`（或 `Ctrl/⌘+Shift+Z`）
- **自动保存**：编辑后防抖保存到 localStorage
- **登录页（本地会话）**：用于演示路由拦截与会话状态管理（不依赖后端）

## 技术栈

- **框架**：React 19、TypeScript
- **构建**：Vite
- **路由**：React Router
- **状态管理**：Zustand
- **代码规范**：ESLint

## 快速开始

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

## 数据存储说明（localStorage）

应用使用 localStorage 作为本地持久化存储：

- **文档索引**：`mynotes_index`
  - 存储侧边栏需要的元信息（标题、预览、更新时间、收藏等）
- **单篇文档内容**：`mynotes_doc_${docId}`
  - 存储序列化后的文档状态（blocks、order、deleted、clock）

提示：撤销/重做栈是内存态，刷新页面不会保留。

## 目录结构（核心）

- `src/store/notesStore.ts`：文档索引与 localStorage 持久化
- `src/store/editorStore.ts`：编辑器状态（blocks、undo/redo、自动保存）
- `src/pages/EditorPage.tsx`：编辑器页面
- `src/components/BlockRow.tsx`：单个块的渲染与交互
- `src/components/SlashMenu.tsx`：斜杠菜单

## 常见问题

- **为什么是本地存储？**
  - 该项目定位为本地笔记应用，优先保证离线可用与实现简单；如需跨设备同步，可在此基础上接入后端存储与实时通道（WebSocket 等）。
