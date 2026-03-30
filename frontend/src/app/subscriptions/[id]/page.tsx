'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Subscription {
  id: string;
  packageName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  isActive: boolean;
  isExpired: boolean;
  isExhausted: boolean;
  createdAt: string;
  student: {
    id: string;
    name: string;
  };
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSub = () => {
    setLoading(true);
    fetch(`${API_URL}/api/subscriptions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSub(data);
      })
      .catch(() => setError('Không thể kết nối đến server'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSub(); }, [id]);

  const handleMarkUsed = async () => {
    setMessage('');
    setMarking(true);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${id}/use`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setMessage('Đã đánh dấu dùng 1 buổi.');
        fetchSub();
      } else {
        setMessage(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setMessage('Không thể kết nối đến server');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  if (error || !sub) return (
    <div className="text-center py-16">
      <div className="text-red-500 mb-4">{error || 'Không tìm thấy gói học'}</div>
      <Link href="/students" className="btn-secondary">← Quay lại</Link>
    </div>
  );

  const pct = Math.round((sub.usedSessions / sub.totalSessions) * 100);
  const statusLabel = sub.isActive ? 'Còn hiệu lực' : sub.isExpired ? 'Hết hạn ngày' : 'Đã dùng hết buổi';
  const statusClass = sub.isActive ? 'badge-active' : 'badge-warning';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/students" className="hover:text-blue-600">Học Sinh</Link>
        <span>/</span>
        <Link href={`/students/${sub.student.id}`} className="hover:text-blue-600">{sub.student.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Gói học</span>
      </div>

      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sub.packageName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Học sinh: <Link href={`/students/${sub.student.id}`} className="text-blue-600 hover:underline font-medium">{sub.student.name}</Link>
            </p>
          </div>
          <span className={statusClass}>{statusLabel}</span>
        </div>

        {/* Big progress display */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
          <div className="flex items-end justify-center gap-2 mb-2">
            <span className="text-6xl font-bold text-gray-900">{sub.usedSessions}</span>
            <span className="text-2xl text-gray-400 mb-2">/ {sub.totalSessions}</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">buổi đã dùng / tổng buổi</p>

          <div className="bg-gray-200 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{pct}% đã sử dụng</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{sub.totalSessions}</div>
            <div className="text-xs text-gray-500 mt-0.5">Tổng buổi</div>
          </div>
          <div className="text-center bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{sub.usedSessions}</div>
            <div className="text-xs text-gray-500 mt-0.5">Đã dùng</div>
          </div>
          <div className={`text-center rounded-lg p-3 ${sub.remainingSessions > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${sub.remainingSessions > 0 ? 'text-green-700' : 'text-gray-400'}`}>
              {sub.remainingSessions}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Còn lại</div>
          </div>
        </div>

        {/* Date info */}
        <div className="border-t border-gray-100 pt-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày bắt đầu</span>
            <span className="font-medium">{new Date(sub.startDate).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày kết thúc</span>
            <span className={`font-medium ${sub.isExpired ? 'text-red-600' : ''}`}>
              {new Date(sub.endDate).toLocaleDateString('vi-VN')}
              {sub.isExpired && ' (đã hết hạn)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày tạo</span>
            <span className="font-medium">{new Date(sub.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        {/* Action */}
        {message && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${message.includes('lỗi') || message.includes('hết') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleMarkUsed}
          disabled={marking || !sub.isActive}
          className="btn-primary w-full"
          title={!sub.isActive ? 'Gói học không còn hiệu lực' : ''}
        >
          {marking ? 'Đang cập nhật...' : 'Đánh dấu dùng 1 buổi (PATCH /use)'}
        </button>
        {!sub.isActive && (
          <p className="text-xs text-center text-gray-400 mt-2">Gói học không còn hiệu lực</p>
        )}
      </div>
    </div>
  );
}
