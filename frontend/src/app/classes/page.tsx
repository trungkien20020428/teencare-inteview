'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS: Record<string, string> = {
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ Nhật',
};

interface Class {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  timeSlot: string;
  teacherName: string;
  maxStudents: number;
  enrolledCount: number;
  availableSlots: number;
}

interface Student {
  id: string;
  name: string;
  currentGrade: string;
}

interface Registration {
  id: string;
  classId: string;
  studentId: string;
  registeredAt: string;
  student: { id: string; name: string; currentGrade: string };
  class: { name: string; dayOfWeek: string; timeSlot: string };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [classForm, setClassForm] = useState({
    name: '',
    subject: '',
    dayOfWeek: 'Monday',
    timeSlot: '',
    teacherName: '',
    maxStudents: 15,
  });

  const fetchData = async () => {
    try {
      const url = selectedDay
        ? `${API_URL}/api/classes?day=${selectedDay}`
        : `${API_URL}/api/classes`;
      const [classesRes, studentsRes, regsRes] = await Promise.all([
        fetch(url),
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/registrations`),
      ]);
      const [classesData, studentsData, regsData] = await Promise.all([
        classesRes.json(),
        studentsRes.json(),
        regsRes.json(),
      ]);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setRegistrations(Array.isArray(regsData) ? regsData : []);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...classForm, maxStudents: Number(classForm.maxStudents) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setSuccess(`Đã tạo lớp "${data.name}" thành công!`);
      setClassForm({ name: '', subject: '', dayOfWeek: 'Monday', timeSlot: '', teacherName: '', maxStudents: 15 });
      fetchData();
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (!selectedClassId || !selectedStudentId) return;
    setRegSubmitting(selectedClassId);

    try {
      const res = await fetch(`${API_URL}/api/classes/${selectedClassId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || 'Có lỗi xảy ra');
        return;
      }

      const studentName = students.find((s) => s.id === selectedStudentId)?.name;
      const className = classes.find((c) => c.id === selectedClassId)?.name;
      setRegSuccess(`Đã đăng ký "${studentName}" vào lớp "${className}" thành công!`);
      setSelectedStudentId('');
      fetchData();
    } catch {
      setRegError('Không thể kết nối đến server');
    } finally {
      setRegSubmitting(null);
    }
  };

  const handleCancelRegistration = async (regId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đăng ký này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/registrations/${regId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setRegSuccess(data.message);
        fetchData();
      } else {
        setRegError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setRegError('Không thể kết nối đến server');
    }
  };

  // Group classes by day
  const classesByDay: Record<string, Class[]> = {};
  DAYS.forEach((day) => {
    const dayClasses = classes.filter((c) => c.dayOfWeek === day);
    if (dayClasses.length > 0) classesByDay[day] = dayClasses;
  });

  const getRegistrationsForClass = (classId: string) =>
    registrations.filter((r) => r.classId === classId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Lớp Học</h1>
        <p className="text-gray-500 mt-1">Quản lý lớp học và đăng ký học sinh</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Class Creation Form */}
        <div className="card">
          <h2 className="section-title">Tạo Lớp Mới</h2>
          <form onSubmit={handleClassSubmit} className="space-y-3">
            <div>
              <label className="label">Tên Lớp *</label>
              <input type="text" className="input-field" placeholder="Toán Đại Số" value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Môn Học *</label>
              <input type="text" className="input-field" placeholder="Toán" value={classForm.subject}
                onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })} required />
            </div>
            <div>
              <label className="label">Ngày Học *</label>
              <select className="input-field" value={classForm.dayOfWeek}
                onChange={(e) => setClassForm({ ...classForm, dayOfWeek: e.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Khung Giờ * (HH:MM-HH:MM)</label>
              <input type="text" className="input-field" placeholder="08:00-09:30" value={classForm.timeSlot}
                onChange={(e) => setClassForm({ ...classForm, timeSlot: e.target.value })}
                pattern="\d{2}:\d{2}-\d{2}:\d{2}" required />
            </div>
            <div>
              <label className="label">Giáo Viên *</label>
              <input type="text" className="input-field" placeholder="Thầy Nguyễn..." value={classForm.teacherName}
                onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })} required />
            </div>
            <div>
              <label className="label">Sĩ Số Tối Đa *</label>
              <input type="number" className="input-field" min={1} value={classForm.maxStudents}
                onChange={(e) => setClassForm({ ...classForm, maxStudents: Number(e.target.value) })} required />
            </div>

            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div>}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Lớp'}
            </button>
          </form>
        </div>

        {/* Schedule + Registration */}
        <div className="lg:col-span-3 space-y-4">
          {/* Registration Form */}
          <div className="card">
            <h2 className="section-title">Đăng Ký Học Sinh Vào Lớp</h2>
            <form onSubmit={handleRegister} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Chọn Lớp</label>
                <select className="input-field" value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)} required>
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.availableSlots <= 0}>
                      {c.name} ({DAY_LABELS[c.dayOfWeek]} {c.timeSlot})
                      {c.availableSlots <= 0 ? ' - Đầy' : ` - Còn ${c.availableSlots} chỗ`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="label">Chọn Học Sinh</label>
                <select className="input-field" value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)} required>
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (Lớp {s.currentGrade})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={!!regSubmitting || !selectedClassId || !selectedStudentId}>
                {regSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
              </button>
            </form>

            {regError && <div className="mt-3 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{regError}</div>}
            {regSuccess && <div className="mt-3 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{regSuccess}</div>}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDay === '' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setSelectedDay('')}
            >
              Tất Cả
            </button>
            {DAYS.map((d) => (
              <button
                key={d}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDay === d ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setSelectedDay(d)}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>

          {/* Weekly Schedule */}
          {loading ? (
            <div className="card text-center text-gray-500 py-8">Đang tải...</div>
          ) : classes.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">Không có lớp học nào</div>
          ) : (
            <div className="space-y-4">
              {DAYS.filter((d) => !selectedDay || d === selectedDay).map((day) => {
                const dayClasses = classes.filter((c) => c.dayOfWeek === day);
                if (dayClasses.length === 0) return null;
                return (
                  <div key={day} className="card">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">{DAY_LABELS[day]}</span>
                    </h3>
                    <div className="space-y-3">
                      {dayClasses.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)).map((cls) => {
                        const clsRegs = getRegistrationsForClass(cls.id);
                        const isFull = cls.enrolledCount >= cls.maxStudents;
                        return (
                          <div key={cls.id} className={`border rounded-lg p-4 ${isFull ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{cls.name}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cls.subject}</span>
                                  {isFull && <span className="badge-warning">Đầy</span>}
                                </div>
                                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                  <div>⏰ {cls.timeSlot}</div>
                                  <div>👨‍🏫 {cls.teacherName}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                  {cls.enrolledCount}/{cls.maxStudents} học sinh
                                </div>
                                {!isFull && (
                                  <div className="text-xs text-gray-400">Còn {cls.availableSlots} chỗ</div>
                                )}
                              </div>
                            </div>

                            {clsRegs.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-400 mb-2">Học sinh đã đăng ký:</p>
                                <div className="flex flex-wrap gap-2">
                                  {clsRegs.map((reg) => (
                                    <div key={reg.id} className="flex items-center gap-1.5 bg-blue-50 rounded-full px-2.5 py-1">
                                      <span className="text-xs text-blue-700">{reg.student.name}</span>
                                      <button
                                        onClick={() => handleCancelRegistration(reg.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors text-xs font-bold"
                                        title="Hủy đăng ký"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
