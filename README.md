# Russian Learning App (俄语学习网站)

基于真实播客内容的俄语词汇学习平台，使用 FSRS 间隔重复算法。

## 技术栈

- **后端**: Java 17 + Spring Boot 3.2
- **前端**: React 18 + Vite
- **数据库**: MySQL 8.0
- **部署**: Docker Compose

## 快速开始

### 1. 启动服务

```bash
docker-compose up -d
```

这会启动三个服务：
- MySQL (端口 3306)
- Spring Boot 后端 (端口 8080)
- React 前端 (端口 3000)

### 2. 导入数据

```bash
# 安装 Python 依赖
pip3 install mysql-connector-python

# 导入词汇和播客数据
python3 db/import_data.py
```

### 3. 访问应用

打开浏览器访问 http://localhost:3000

## 功能

### 词汇学习
- 📖 按级别浏览 4914 个词汇
- 🔍 搜索（俄语/中文）
- 📊 按频率/级别/集数筛选
- 🔊 浏览器 TTS 发音

### 闪卡背单词
- 🃏 3D 翻转动画
- 🧠 FSRS 间隔重复算法
- 📈 学习进度追踪
- ⏰ 复习提醒

### 播客材料
- 🎙️ 129 集 Russian Radio Show
- 📝 中文摘要 + 词汇表 + 好句子
- 🔗 词汇与播客关联

### 测验模式
- 🇷🇺→🇨🇳 俄译中选择题
- 🇨🇳→🇷🇺 中译俄选择题
- 📊 得分统计

### 个性化
- 🌙 日间/夜间主题
- 📱 响应式布局（手机适配）
- 🎯 每日学习目标

## 项目结构

```
russian-learning-app/
├── backend/                 # Spring Boot 后端
│   ├── src/main/java/com/russian/learn/
│   │   ├── controller/      # REST API 控制器
│   │   ├── entity/          # JPA 实体类
│   │   ├── repository/      # 数据访问层
│   │   ├── service/         # 业务逻辑层（含 FSRS）
│   │   ├── security/        # JWT 认证
│   │   └── dto/             # 数据传输对象
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # React 前端
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── contexts/        # 状态管理
│   │   ├── api/             # API 客户端
│   │   └── styles/          # CSS 样式
│   ├── Dockerfile
│   └── nginx.conf
├── db/                      # 数据库
│   ├── schema.sql           # 建表语句
│   └── import_data.py       # 数据导入脚本
├── docker-compose.yml
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/vocab | 词汇列表（分页/筛选） |
| GET | /api/vocab/{id} | 词汇详情 |
| GET | /api/vocab/random-quiz | 测验用随机词汇 |
| GET | /api/learning/due | 待复习卡片 |
| POST | /api/learning/review | 提交复习结果 |
| GET | /api/learning/stats | 学习统计 |
| GET | /api/learning/new-words | 新词列表 |
| GET | /api/episodes | 播客列表 |
| GET | /api/episodes/{id} | 播客详情 |
| GET | /api/user/profile | 用户信息 |
| PUT | /api/user/theme | 更新主题 |

## 数据来源

- Russian Radio Show (RRS) 播客转录（129 集）
- 词汇提取自 31 万词语料库
- 覆盖 A1 到 C1 所有级别
