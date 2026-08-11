# Tally — 个人记账系统

> 一个部署在 Vercel、数据存储在 MongoDB Atlas 的个人记账 Web 应用。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 认证 | NextAuth.js (Credentials Provider, 邮箱+密码) |
| 数据库 | MongoDB Atlas |
| ORM | Prisma |
| 部署 | Vercel |
| 代码托管 | GitHub |
| 国际化 | next-intl (中英双语) |

---

## 功能需求

### 1. 用户认证
- 邮箱 + 密码注册/登录
- 未登录用户不可访问任何功能页面，自动重定向到登录页
- 登出功能

### 2. 银行卡管理
- 增删改银行卡
- 银行卡字段：名称（如"招商银行"）、类型（借记卡/信用卡）、默认币种
- 删除银行卡时需确认，不影响已有流水记录

### 3. 记账 (CRUD)
- 新增流水：选择类型（收入/支出）、填写金额、选择币种、选择银行卡、填写日期时间、填写备注
- 编辑流水：修改已有记录的任意字段
- 删除流水：确认后删除
- 流水列表：分页展示，按时间倒序排列

### 4. 常用备注
- 全局统一管理（所有银行卡共用）
- 增删常用备注
- 记账时可通过下拉选择/搜索快速填充备注

### 5. 多币种
- 每笔流水独立选择币种（CNY / USD / JPY / HKD / EUR / GBP 等）
- 各自按原币种统计，不做汇率换算
- 银行卡可设定默认币种，记账时自动选中

### 6. 统计看板
- 时间段选择器（支持快速选项：今日 / 本周 / 本月 / 本年 / 自定义范围）
- 银行卡筛选（可选，默认全部）
- 实时计算并展示：
  - **总收入**（按币种分组显示）
  - **总支出**（按币种分组显示）
  - **净收支**
  - **各银行卡收支明细**
- 以卡片或图表形式直观展示

### 7. 界面
- 简洁、干净的设计风格
- 所有功能按钮集中排列，操作路径短
- 中英文双语切换

---

## 数据模型

### User (用户)
```prisma
model User {
  id           String        @id @default(auto()) @map("_id") @db.ObjectId
  name         String?
  email        String        @unique
  hashedPassword String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  bankCards    BankCard[]
  transactions Transaction[]
  commonNotes  CommonNote[]
}
```

### BankCard (银行卡)
```prisma
model BankCard {
  id           String        @id @default(auto()) @map("_id") @db.ObjectId
  userId       String        @db.ObjectId
  user         User          @relation(fields: [userId], references: [id])
  name         String
  type         CardType      // DEBIT | CREDIT
  defaultCurrency String     @default("CNY")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}
```

### Transaction (流水记录)
```prisma
model Transaction {
  id           String        @id @default(auto()) @map("_id") @db.ObjectId
  userId       String        @db.ObjectId
  user         User          @relation(fields: [userId], references: [id])
  cardId       String?       @db.ObjectId
  card         BankCard?     @relation(fields: [cardId], references: [id])
  type         TransType     // INCOME | EXPENSE
  amount       Float
  currency     String        @default("CNY")
  dateTime     DateTime
  note         String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

### CommonNote (常用备注)
```prisma
model CommonNote {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

### 枚举
```prisma
enum CardType {
  DEBIT
  CREDIT
}

enum TransType {
  INCOME
  EXPENSE
}
```

---

## 页面路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | 统计看板 | 时间段+银行卡筛选，实时收支统计 |
| `/login` | 登录 | 邮箱+密码登录 |
| `/register` | 注册 | 邮箱+密码注册 |
| `/transactions` | 流水管理 | 流水列表 + 增删改查 |
| `/transactions/new` | 新增流水 | 记账表单 |
| `/transactions/[id]/edit` | 编辑流水 | 修改已有流水 |
| `/bank-cards` | 银行卡管理 | 银行卡增删改 |
| `/common-notes` | 常用备注管理 | 常用备注增删 |

---

## 目录结构

```
tally/
├── .env                      # 环境变量
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma         # 数据模型
├── messages/
│   ├── zh.json               # 中文翻译
│   └── en.json               # 英文翻译
└── src/
    ├── app/
    │   ├── layout.tsx        # 根布局（含 i18n Provider）
    │   ├── page.tsx          # 首页 → 重定向到 /dashboard
    │   ├── globals.css
    │   ├── login/
    │   ├── register/
    │   ├── dashboard/        # 统计看板
    │   ├── transactions/
    │   ├── bank-cards/
    │   ├── common-notes/
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       ├── transactions/
    │       ├── bank-cards/
    │       └── common-notes/
    ├── components/
    │   ├── ui/               # 通用 UI 组件（Button, Input, Modal, Select...）
    │   ├── layout/           # 布局组件（Sidebar, Header）
    │   ├── TransactionForm.tsx
    │   ├── TransactionList.tsx
    │   ├── BankCardForm.tsx
    │   ├── BankCardList.tsx
    │   ├── CommonNoteForm.tsx
    │   ├── DashboardStats.tsx
    │   └── DateRangePicker.tsx
    ├── lib/
    │   ├── prisma.ts         # Prisma Client 单例
    │   ├── auth.ts           # NextAuth 配置
    │   ├── i18n.ts           # i18n 初始化
    │   └── utils.ts          # 工具函数
    └── types/
        └── index.ts          # TypeScript 类型定义
```

---

## 开发路径

整个项目按 **8 个阶段** 迭代开发，每个阶段产出可独立验证的成果。

### 第一阶段：项目初始化与环境搭建

**目标**：搭建可运行的 Next.js 项目，连接 MongoDB，配置 Prisma

步骤：
1. 初始化 Next.js 项目（含 TypeScript、Tailwind、ESLint）
2. 安装依赖：`prisma`, `@prisma/client`, `next-auth`, `bcryptjs`, `next-intl`
3. 编写 `prisma/schema.prisma`，定义所有数据模型
4. 配置 `src/lib/prisma.ts` Prisma Client 单例
5. 配置 `.env` 文件（DATABASE_URL、NEXTAUTH_SECRET 等）
6. 运行 `prisma db push` 同步数据库
7. 配置 `src/app/globals.css`（Tailwind 基础样式）
8. 配置 `next.config.js`（i18n 等）
9. 验证：`npm run dev` 启动，页面正常渲染

### 第二阶段：用户认证系统

**目标**：实现注册、登录、登出、会话保护

步骤：
1. 配置 NextAuth（`src/lib/auth.ts`）
2. 实现注册 API（`src/app/api/auth/register/route.ts`）
3. 实现登录页面（`src/app/login/page.tsx`）
4. 实现注册页面（`src/app/register/page.tsx`）
5. 创建 `AuthProvider` 组件包裹布局
6. 创建中间件（`src/middleware.ts`）保护路由，未登录自动跳转 /login
7. 验证：注册 → 登录 → 登出 流程完整

### 第三阶段：布局与导航

**目标**：搭建整体页面布局、侧边栏导航、中英文切换

步骤：
1. 创建 `src/components/layout/Sidebar.tsx`（导航菜单）
2. 创建 `src/components/layout/Header.tsx`（顶部栏，含用户信息、登出、语言切换）
3. 创建 `src/components/layout/AuthLayout.tsx`（登录后页面布局）
4. 配置 next-intl 中英文翻译文件（`messages/zh.json`, `messages/en.json`）
5. 创建语言切换组件
6. 验证：所有页面正确显示布局，语言切换生效

### 第四阶段：银行卡管理

**目标**：实现银行卡的增删改

步骤：
1. 创建 `src/app/api/bank-cards/route.ts`（GET 列表、POST 新增）
2. 创建 `src/app/api/bank-cards/[id]/route.ts`（PUT 编辑、DELETE 删除）
3. 创建 `src/app/bank-cards/page.tsx`（银行卡管理页面）
4. 创建 `BankCardList.tsx` 和 `BankCardForm.tsx` 组件
5. 验证：增删改银行卡功能正常

### 第五阶段：流水 CRUD & 常用备注

**目标**：实现记账功能的所有操作及常用备注管理

步骤：
1. 创建 `src/app/api/transactions/route.ts`（GET 列表 + 日期筛选、POST 新增）
2. 创建 `src/app/api/transactions/[id]/route.ts`（PUT 编辑、DELETE 删除）
3. 创建 `src/app/api/common-notes/route.ts`（GET 列表、POST 新增）
4. 创建 `src/app/api/common-notes/[id]/route.ts`（DELETE 删除）
5. 创建 `src/app/transactions/page.tsx`（流水列表页，含分页、筛选）
6. 创建 `src/app/transactions/new/page.tsx`（新增流水页）
7. 创建 `src/app/transactions/[id]/edit/page.tsx`（编辑流水页）
8. 创建 `src/app/common-notes/page.tsx`（常用备注管理页）
9. 创建 `TransactionForm.tsx`（含银行卡选择、币种选择、常用备注下拉选择）
10. 创建 `TransactionList.tsx`（流水列表展示）
11. 验证：流水的增删改查完整，常用备注增删正常

### 第六阶段：统计看板

**目标**：实现带时间段和银行卡筛选的实时收支统计

步骤：
1. 创建 `DateRangePicker.tsx`（时间段选择器：今日/本周/本月/本年/自定义）
2. 创建 `DashboardStats.tsx`（统计卡片展示：总收入、总支出、净收支）
3. 创建 API：`src/app/api/dashboard/stats/route.ts`
   - 接收 `startDate`, `endDate`, `cardId` 参数
   - 返回按币种分组的收支汇总及各卡明细
4. 实现 `src/app/dashboard/page.tsx`（看板页面）
5. 验证：选择时间段和银行卡后数据正确更新

### 第七阶段：UI 打磨 & 多币种完善

**目标**：完善界面细节、交互体验，确保多币种支持完整

步骤：
1. 统一页面风格，按钮布局集中整齐
2. 流水中币种显示（金额旁显示货币符号）
3. 统计看板按币种分组展示数据
4. 银行卡默认币种在记账时自动选中
5. 空状态展示、加载状态、错误提示
6. 响应式适配（移动端可用）
7. 验证：全功能走查，中英文切换下界面完整

### 第八阶段：部署与文档

**目标**：部署到 Vercel，编写 README

步骤：
1. 初始化 Git 仓库，推送至 GitHub
2. 在 Vercel 中导入项目
3. 配置 Vercel 环境变量（DATABASE_URL、NEXTAUTH_SECRET、NEXTAUTH_URL）
4. 配置 MongoDB Atlas 网络白名单允许 Vercel IP
5. 编写 README.md（项目说明、技术栈、本地运行指南、部署指南）
6. 验证：生产环境全功能正常

---

## API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/[...nextauth]` | 登录 (NextAuth) |
| GET | `/api/bank-cards` | 获取银行卡列表 |
| POST | `/api/bank-cards` | 新增银行卡 |
| PUT | `/api/bank-cards/[id]` | 编辑银行卡 |
| DELETE | `/api/bank-cards/[id]` | 删除银行卡 |
| GET | `/api/transactions` | 获取流水列表（支持日期/银行卡筛选） |
| POST | `/api/transactions` | 新增流水 |
| PUT | `/api/transactions/[id]` | 编辑流水 |
| DELETE | `/api/transactions/[id]` | 删除流水 |
| GET | `/api/common-notes` | 获取常用备注列表 |
| POST | `/api/common-notes` | 新增常用备注 |
| DELETE | `/api/common-notes/[id]` | 删除常用备注 |
| GET | `/api/dashboard/stats` | 统计看板数据 |
