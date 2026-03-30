'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  timeSlot: string;
  teacherName: string;
}

interface Registration {
  id: string;
  registeredAt: string;
  class: ClassInfo;
}

interface Subscription {
  id: string;
  packageName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  usedSessions: number;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  dob: string;
  gender: string;
  currentGrade: string;
  parent: Parent;
  registrations: Registration[];
  subscriptions: Subscription[];
  createdAt: string;
}

const DAY_LABELS: Record<string, string> = {
  Monday: 'Thứ 2', Tuesday: 'Thứ 3', Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5', Friday: 'Thứ 6', Saturday: 'Thứ 7', Sunday: 'CN',
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/students/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStudent(data);
      })
      .catch(() => setError('Không thể kết nối đến server'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  if (error || !student) return (
    <div className="text-center py-16">
      <div className="text-red-500 mb-4">{error || 'Không tìm thấy học sinh'}</div>
      <Link href="/students" className="btn-secondary">← Quay lại</Link>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/students" className="hover:text-blue-600">Học Sinh</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{student.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Student Info */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-sm text-gray-500">Lớp {student.currentGrade} • {student.gender === 'male' ? 'Nam' : 'Nữ'}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Ngày sinh</dt>
                <dd className="font-medium">{new Date(student.dob).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Khối lớp</dt>
                <dd className="font-medium">Lớp {student.currentGrade}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Giới tính</dt>
                <dd className="font-medium">{student.gender === 'male' ? 'Nam' : 'Nữ'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ngày tạo</dt>
                <dd className="font-medium">{new Date(student.createdAt).toLocaleDateString('vi-VN')}</dd>
              </div>
            </dl>
          </div>

          {/* Parent Info */}
          <div className="card">
            <h2 className="section-title">Thông Tin Phụ Huynh</h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
                {student.parent.name.charAt(0)}
              </div>
              <dl className="space-y-1.5 text-sm flex-1">
                <div>
                  <dt className="text-xs text-gray-400">Họ tên</dt>
                  <dd className="font-semibold text-gray-900">{student.parent.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Điện thoại</dt>
                  <dd className="font-medium">📞 {student.parent.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="font-medium text-blue-600 break-all">✉️ {student.parent.email}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Subscriptions + Registrations */}
        <div className="lg:col-span-2 space-y-4">

          {/* Subscriptions */}
          <div className="card">
            <h2 className="section-title">Gói Học ({student.subscriptions.length})</h2>
            {student.subscriptions.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có gói học nào</p>
            ) : (
              <div className="space-y-3">
                {student.subscriptions.map((sub) => {
                  const isActive = sub.endDate >= today && sub.usedSessions < sub.totalSessions;
                  const pct = Math.round((sub.usedSessions / sub.totalSessions) * 100);
                  return (
                    <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{sub.packageName}</span>
                            <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                              {isActive ? 'Còn hiệu lực' : sub.endDate < today ? 'Hết hạn' : 'Hết buổi'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(sub.startDate).toLocaleDateString('vi-VN')} – {new Date(sub.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <Link
                          href={`/subscriptions/${sub.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Xem chi tiết →
                        </Link>
                      </div>

                      {/* Session progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {sub.usedSessions} / {sub.totalSessions} buổi
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Còn lại: <strong className="text-gray-700">{sub.totalSessions - sub.usedSessions} buổi</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Class Registrations */}
          <div className="card">
            <h2 className="section-title">Lớp Đã Đăng Ký ({student.registrations.length})</h2>
            {student.registrations.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa đăng ký lớp nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="pb-2 pr-4">Lớp</th>
                      <th className="pb-2 pr-4">Môn</th>
                      <th className="pb-2 pr-4">Lịch</th>
                      <th className="pb-2 pr-4">Giáo viên</th>
                      <th className="pb-2">Ngày ĐK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {student.registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium">{reg.class.name}</td>
                        <td className="py-2 pr-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{reg.class.subject}</span>
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {DAY_LABELS[reg.class.dayOfWeek]} {reg.class.timeSlot}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{reg.class.teacherName}</td>
                        <td className="py-2 text-gray-400 text-xs">
                          {new Date(reg.registeredAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
