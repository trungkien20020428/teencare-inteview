'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  parents: number;
  students: number;
  classes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ parents: 0, students: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [parentsRes, studentsRes, classesRes] = await Promise.all([
          fetch(`${API_URL}/api/parents`),
          fetch(`${API_URL}/api/students`),
          fetch(`${API_URL}/api/classes`),
        ]);
        const [parents, students, classes] = await Promise.all([
          parentsRes.json(),
          studentsRes.json(),
          classesRes.json(),
        ]);
        setStats({
          parents: Array.isArray(parents) ? parents.length : 0,
          students: Array.isArray(students) ? students.length : 0,
          classes: Array.isArray(classes) ? classes.length : 0,
        });
      } catch {
        // API not yet available
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Phụ Huynh',
      count: stats.parents,
      href: '/parents',
      color: 'bg-purple-500',
      desc: 'Quản lý thông tin phụ huynh',
    },
    {
      title: 'Học Sinh',
      count: stats.students,
      href: '/students',
      color: 'bg-blue-500',
      desc: 'Quản lý thông tin học sinh',
    },
    {
      title: 'Lớp Học',
      count: stats.classes,
      href: '/classes',
      color: 'bg-green-500',
      desc: 'Lịch lớp học & đăng ký',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 mt-1">Hệ thống quản lý học sinh Teen Care</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${card.color} text-white rounded-xl p-4 text-3xl font-bold min-w-[64px] text-center`}>
                {loading ? '...' : card.count}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm text-gray-500">{card.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">Truy cập nhanh</h2>
          <div className="space-y-2">
            <Link href="/parents" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">👨‍👩‍👧</span>
              <div>
                <div className="font-medium">Thêm Phụ Huynh Mới</div>
                <div className="text-sm text-gray-500">Tạo hồ sơ phụ huynh</div>
              </div>
            </Link>
            <Link href="/students" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">🎓</span>
              <div>
                <div className="font-medium">Thêm Học Sinh Mới</div>
                <div className="text-sm text-gray-500">Đăng ký học sinh & gói học</div>
              </div>
            </Link>
            <Link href="/classes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-medium">Xem Lịch Lớp Học</div>
                <div className="text-sm text-gray-500">Thời khóa biểu tuần & đăng ký lớp</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Hướng dẫn sử dụng</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>Tạo <strong>Phụ Huynh</strong> trước (cần email & số điện thoại)</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>Tạo <strong>Học Sinh</strong> và liên kết với phụ huynh</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>Tạo <strong>Gói Học</strong> (subscription) cho học sinh</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0">4</span>
              <span>Vào <strong>Lớp Học</strong> để đăng ký học sinh vào lớp</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
