'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Student {
  id: string;
  name: string;
}

interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  students: Student[];
  createdAt: string;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetchParents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/parents`);
      const data = await res.json();
      setParents(Array.isArray(data) ? data : []);
    } catch {
      setError('Không thể tải danh sách phụ huynh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setSuccess(`Đã tạo phụ huynh "${data.name}" thành công!`);
      setForm({ name: '', phone: '', email: '' });
      fetchParents();
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Quản lý Phụ Huynh</h1>
        <p className="text-gray-500 mt-1">Thêm và xem thông tin phụ huynh</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="section-title">Thêm Phụ Huynh Mới</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và Tên *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nguyễn Văn An"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Số Điện Thoại *</label>
              <input
                type="tel"
                className="input-field"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input-field"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Phụ Huynh'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="section-title">Danh Sách Phụ Huynh ({parents.length})</h2>

            {loading ? (
              <div className="text-gray-500 text-center py-8">Đang tải...</div>
            ) : parents.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Chưa có phụ huynh nào</div>
            ) : (
              <div className="space-y-3">
                {parents.map((parent) => (
                  <div key={parent.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                          <div>📞 {parent.phone}</div>
                          <div>✉️ {parent.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">
                          {new Date(parent.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        {parent.students?.length > 0 ? (
                          <span className="badge-active">{parent.students.length} học sinh</span>
                        ) : (
                          <span className="badge-inactive">Chưa có học sinh</span>
                        )}
                      </div>
                    </div>
                    {parent.students?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Học sinh:</p>
                        <div className="flex flex-wrap gap-1">
                          {parent.students.map((s) => (
                            <span key={s.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
