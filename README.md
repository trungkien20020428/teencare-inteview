# Teen Care LMS

Mini Learning Management System cho phép quản lý Học sinh, Phụ huynh, Lớp học và Gói học.

## Tech Stack

| Layer     | Công nghệ                              |
|-----------|----------------------------------------|
| Backend   | Node.js · Express · TypeScript · TypeORM |
| Database  | PostgreSQL 15                          |
| Frontend  | Next.js 14 · Tailwind CSS              |
| DevOps    | Docker · Docker Compose  |

---

## Yêu cầu môi trường

| Công cụ        | Phiên bản tối thiểu |
|----------------|---------------------|
| Docker         | 24+                 |
| Docker Compose | 2+                  |
| Node.js (dev)  | 20+                 |

---

## Khởi chạy nhanh với Docker

### 1. Clone project

```bash
git clone <repo-url>
cd teen-care-interview
```

### 2. Chạy toàn bộ hệ thống (production mode)

```bash
docker compose up --build
```

> Thêm `-d` để chạy nền: `docker compose up --build -d`

Khi khởi động, backend tự động:
1. Migrate schema database (TypeORM `synchronize`)
2. Seed dữ liệu mẫu (2 phụ huynh · 3 học sinh · 3 lớp · 3 gói học)

### 3. Truy cập

| Service       | URL                        |
|---------------|----------------------------|
| Frontend      | http://localhost:3002       |
| Backend API   | http://localhost:3001       |
| PostgreSQL    | localhost:5432              |

### 4. Dừng hệ thống

```bash
docker compose down        # Giữ nguyên data
docker compose down -v     # Xóa cả volumes (reset DB)
```

---

## Dev mode (hot reload)

```bash
# Bước 1: build backend trước để có dist/seed.js
cd backend && npm install && npm run build && cd ..

# Bước 2: chạy dev stack
docker compose -f docker-compose.dev.yml up
```

- **Frontend** http://localhost:3002 — tự reload khi sửa file `.tsx`
- **Backend** http://localhost:3001 — tự restart khi sửa file `.ts` (ts-node-dev)
- Không cần rebuild Docker image mỗi lần thay đổi code

---

## Chạy local (không Docker)

```bash
# Terminal 1 — PostgreSQL (cần Docker)
docker run -d --name pg \
  -e POSTGRES_USER=teencare \
  -e POSTGRES_PASSWORD=teencare123 \
  -e POSTGRES_DB=teencare \
  -p 5432:5432 postgres:15-alpine

# Terminal 2 — Backend
cd backend
cp .env.example .env   # chỉnh DATABASE_URL nếu cần
npm install
npm run build
npm run seed           # seed dữ liệu mẫu
npm run dev            # dev với hot reload

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev            # http://localhost:3000
```

---

## Chạy tests

```bash
cd backend
npm test               # chạy toàn bộ test suite
npm run test:coverage  # kèm báo cáo coverage
```

---

## Kiến trúc Docker

```
docker-compose.yml
├── db          postgres:15-alpine  :5432
├── backend     ./backend/Dockerfile  :3001
│               └── depends_on: db (healthcheck)
└── frontend    ./frontend/Dockerfile  :3002
                └── depends_on: backend
```

**Backend Dockerfile** — multi-stage build:
- `builder`: cài deps + compile TypeScript → `dist/`
- `production`: chỉ copy `dist/` + production deps → image nhỏ gọn

**Frontend Dockerfile** — multi-stage build:
- `builder`: cài deps + `next build` (standalone output)
- `production`: chạy `node server.js` (Next.js standalone)

---

## Project Structure

```
teen-care-interview/
├── backend/
│   ├── src/
│   │   ├── entities/           # TypeORM entities (data models)
│   │   │   ├── Parent.ts
│   │   │   ├── Student.ts
│   │   │   ├── Class.ts
│   │   │   ├── ClassRegistration.ts
│   │   │   └── Subscription.ts
│   │   ├── routes/             # Express route handlers
│   │   │   ├── parents.ts
│   │   │   ├── students.ts
│   │   │   ├── classes.ts
│   │   │   ├── registrations.ts
│   │   │   └── subscriptions.ts
│   │   ├── utils/
│   │   │   └── timeUtils.ts    # Kiểm tra trùng lịch + tính hoàn tiền
│   │   ├── data-source.ts      # TypeORM DataSource config
│   │   ├── seed.ts             # Seed dữ liệu mẫu
│   │   └── index.ts            # Express app entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── parents/page.tsx    # Quản lý phụ huynh
│   │   ├── students/page.tsx   # Quản lý học sinh + gói học
│   │   ├── students/[id]/      # Chi tiết học sinh
│   │   ├── classes/page.tsx    # Lịch lớp + đăng ký
│   │   └── subscriptions/[id]/ # Chi tiết gói học
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Dev stack (hot reload)
└── README.md
```

---

## API Endpoints

| Method | Path                        | Mô tả                        |
|--------|-----------------------------|------------------------------|
| GET    | `/health`                   | Health check                 |
| CRUD   | `/api/parents`              | Quản lý phụ huynh            |
| CRUD   | `/api/students`             | Quản lý học sinh             |
| CRUD   | `/api/classes`              | Quản lý lớp học              |
| CRUD   | `/api/registrations`        | Đăng ký học sinh vào lớp     |
| CRUD   | `/api/subscriptions`        | Quản lý gói học              |
