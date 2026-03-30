# Teen Care LMS

Mini Learning Management System cho phép quản lý Học sinh, Phụ huynh, Lớp học và Gói học.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15
- **Frontend**: Next.js 14 + Tailwind CSS
- **DevOps**: Docker + docker-compose

---

## Khởi chạy với Docker (Khuyến nghị)

### Yêu cầu
- Docker >= 24
- Docker Compose >= 2

### Chạy toàn bộ hệ thống

```bash
# Clone project
git clone <repo-url>
cd teen-care-interview

# Build và khởi chạy tất cả services
docker compose up --build

# Chạy nền (detached)
docker compose up --build -d
```

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

Khi khởi động, backend tự động:
1. Chạy migrate database
2. Seed dữ liệu mẫu (2 phụ huynh, 3 học sinh, 3 lớp, 3 gói học)

### Dừng hệ thống
```bash
docker compose down          # Giữ data
docker compose down -v       # Xóa cả data (volumes)
```

## Dev mode (hot reload)

```bash
# Lần đầu: build backend trước (cần dist/seed.js)
cd backend && npm install && npm run build && cd ..

# Chạy dev stack (frontend hot-reload, backend ts-node-dev)
docker compose -f docker-compose.dev.yml up
```

- Frontend tại http://localhost:3002 — tự reload khi sửa file
- Backend tại http://localhost:3001 — tự restart khi sửa file (ts-node-dev)
- Không cần rebuild Docker image mỗi lần thay đổi code



## Project Structure

```
teen-care-interview/
├── backend/
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   │   ├── parents.ts
│   │   │   ├── students.ts
│   │   │   ├── classes.ts
│   │   │   ├── registrations.ts
│   │   │   └── subscriptions.ts
│   │   ├── utils/
│   │   │   └── timeUtils.ts  # Time slot overlap + refund logic
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── Dockerfile
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── parents/page.tsx  # Quản lý phụ huynh
│   │   ├── students/page.tsx # Quản lý học sinh + gói học
│   │   └── classes/page.tsx  # Lịch lớp + đăng ký
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
