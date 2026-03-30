'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Parent {
  id: string;
  name: string;
}

interface Subscription {
  id: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  endDate: string;
  isActive: boolean;
}

interface Student {
  id: string;
  name: string;
  dob: string;
  gender: string;
  currentGrade: string;
  parent: Parent;
  subscriptions?: Subscription[];
  createdAt: string;
}

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subError, setSubError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: 'male',
    currentGrade: '10',
    parentId: '',
  });

  const [subForm, setSubForm] = useState({
    studentId: '',
    packageName: 'Gói 20 Buổi',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalSessions: 20,
  });

  const fetchData = async () => {
    try {
      const [studentsRes, parentsRes] = await Promise.all([
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/parents`),
      ]);
      const [studentsData, parentsData] = await Promise.all([
        studentsRes.json(),
        parentsRes.json(),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setParents(Array.isArray(parentsData) ? parentsData : []);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set default end date to 3 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setSubForm((f) => ({ ...f, endDate: d.toISOString().split('T')[0] }));
  }, []);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setSuccess(`Đã tạo học sinh "${data.name}" thành công!`);
      setForm({ name: '', dob: '', gender: 'male', currentGrade: '10', parentId: '' });
      fetchData();
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError('');
    setSubSuccess('');
    setSubSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subForm, totalSessions: Number(subForm.totalSessions) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setSubSuccess(`Đã tạo gói học "${data.packageName}" thành công!`);
      fetchData();
    } catch {
      setSubError('Không thể kết nối đến server');
    } finally {
      setSubSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Quản lý Học Sinh</h1>
        <p className="text-gray-500 mt-1">Thêm học sinh và tạo gói học</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Student Form */}
        <div className="card">
          <h2 className="section-title">Thêm Học Sinh Mới</h2>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và Tên *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nguyễn Minh Khoa"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Ngày Sinh *</label>
              <input
                type="date"
                className="input-field"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Giới Tính *</label>
              <select
                className="input-field"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div>
              <label className="label">Lớp hiện tại *</label>
              <select
                className="input-field"
                value={form.currentGrade}
                onChange={(e) => setForm({ ...form, currentGrade: e.target.value })}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phụ Huynh *</label>
              <select
                className="input-field"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                required
              >
                <option value="">-- Chọn phụ huynh --</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {parents.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Cần tạo phụ huynh trước</p>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div>}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Học Sinh'}
            </button>
          </form>
        </div>

        {/* Subscription Form */}
        <div className="card">
          <h2 className="section-title">Tạo Gói Học</h2>
          <form onSubmit={handleSubSubmit} className="space-y-4">
            <div>
              <label className="label">Học Sinh *</label>
              <select
                className="input-field"
                value={subForm.studentId}
                onChange={(e) => setSubForm({ ...subForm, studentId: e.target.value })}
                required
              >
                <option value="">-- Chọn học sinh --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (Lớp {s.currentGrade})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tên Gói *</label>
              <select
                className="input-field"
                value={subForm.packageName}
                onChange={(e) => setSubForm({ ...subForm, packageName: e.target.value })}
              >
                <option>Gói 10 Buổi</option>
                <option>Gói 20 Buổi</option>
                <option>Gói 30 Buổi</option>
                <option>Gói 40 Buổi</option>
              </select>
            </div>
            <div>
              <label className="label">Số Buổi *</label>
              <input
                type="number"
                className="input-field"
                min={1}
                value={subForm.totalSessions}
                onChange={(e) => setSubForm({ ...subForm, totalSessions: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">Ngày Bắt Đầu *</label>
              <input
                type="date"
                className="input-field"
                value={subForm.startDate}
                onChange={(e) => setSubForm({ ...subForm, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Ngày Kết Thúc *</label>
              <input
                type="date"
                className="input-field"
                value={subForm.endDate}
                onChange={(e) => setSubForm({ ...subForm, endDate: e.target.value })}
                required
              />
            </div>

            {subError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{subError}</div>}
            {subSuccess && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{subSuccess}</div>}

            <button type="submit" className="btn-primary w-full" disabled={subSubmitting}>
              {subSubmitting ? 'Đang tạo...' : 'Tạo Gói Học'}
            </button>
          </form>
        </div>

        {/* Student List */}
        <div className="card lg:col-span-1">
          <h2 className="section-title">Danh Sách Học Sinh ({students.length})</h2>
          {loading ? (
            <div className="text-gray-500 text-center py-8">Đang tải...</div>
          ) : students.length === 0 ? (
            <div className="text-gray-400 text-center py-8">Chưa có học sinh nào</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="block border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm text-blue-700">{student.name}</h3>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Lớp {student.currentGrade} • {student.gender === 'male' ? 'Nam' : 'Nữ'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        PH: {student.parent?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{new Date(student.dob).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs text-blue-500 mt-1">Xem chi tiết →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
