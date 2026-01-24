import React, { useState, useEffect } from 'react';
import { attendanceAPI, classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import TeacherLayout from '../components/TeacherLayout';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Open session form
  const [sessionForm, setSessionForm] = useState({
    radius: 100,
    duration: 15
  });

  useEffect(() => {
    if (user?.user_id) {
      loadClassrooms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClassroom) {
      loadSessions();
      checkActiveSession();
    }
  }, [selectedClassroom]);

  useEffect(() => {
    if (activeSession) {
      loadAttendanceRecords();
      // Refresh records every 5 seconds
      const interval = setInterval(loadAttendanceRecords, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const loadClassrooms = async () => {
    try {
      const response = await classroomAPI.getTeacherClasses(user.user_id);
      console.log('Classrooms loaded:', response.data);
      setClassrooms(response.data || []);

      // Auto-select first classroom if available
      if (response.data && response.data.length > 0) {
        setSelectedClassroom(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
      toast.error('Failed to load classrooms');
    }
  };

  const loadSessions = async () => {
    try {
      const classroomId = selectedClassroom.classroom_id || selectedClassroom._id;
      const response = await attendanceAPI.getClassroomSessions(classroomId, { limit: 10 });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const checkActiveSession = async () => {
    try {
      const classroomId = selectedClassroom.classroom_id || selectedClassroom._id;
      const response = await attendanceAPI.getClassroomSessions(classroomId, { limit: 1 });
      const latestSession = response.data?.[0];
      if (latestSession && latestSession.is_open) {
        setActiveSession(latestSession);
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!activeSession) return;

    try {
      const response = await attendanceAPI.getSessionRecords(activeSession._id);
      setAttendanceRecords(response.data || []);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  const openAttendanceSession = async () => {
    try {
      setLoading(true);

      // Get current location
      toast.loading('Getting your location...');
      const position = await getCurrentLocation();

      toast.dismiss();
      toast.loading('Opening attendance session...');

      const classroomId = selectedClassroom.classroom_id || selectedClassroom._id;
      const response = await attendanceAPI.openSession({
        classroom_id: classroomId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radius: parseInt(sessionForm.radius),
        duration: parseInt(sessionForm.duration)
      });

      toast.dismiss();
      toast.success('Attendance session opened! Students can now mark attendance.');

      // Refresh sessions and set as active
      await loadSessions();
      setActiveSession({
        _id: response.data.session_id,
        is_open: true,
        closes_at: response.data.closes_at
      });

    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Failed to open attendance session');
      console.error('Error opening session:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeAttendanceSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);

      await attendanceAPI.closeSession(activeSession._id);

      toast.success('Attendance session closed');

      setActiveSession(null);
      setAttendanceRecords([]);
      await loadSessions();

    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to close session');
      console.error('Error closing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <TeacherLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Attendance Management</h1>

        {/* Classroom Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Classroom</h2>

          {classrooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No classrooms found. Create a classroom first.</p>
            </div>
          ) : (
            <select
              value={selectedClassroom?.classroom_id || selectedClassroom?._id || ''}
              onChange={(e) => {
                const classroom = classrooms.find(c =>
                  (c.classroom_id === e.target.value) || (c._id === e.target.value)
                );
                setSelectedClassroom(classroom);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Classroom --</option>
              {classrooms.map(classroom => {
                const id = classroom.classroom_id || classroom._id;
                const name = classroom.class_name || classroom.classroom_name || classroom.name || `Classroom ${id}`;
                return (
                  <option key={id} value={id}>
                    {name} {classroom.section && `(${classroom.section})`}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {selectedClassroom && !activeSession && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Open Attendance Session</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Radius (meters)
                </label>
                <input
                  type="number"
                  value={sessionForm.radius}
                  onChange={(e) => setSessionForm({ ...sessionForm, radius: e.target.value })}
                  min="10"
                  max="5000"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Students must be within this distance to mark attendance
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                  min="1"
                  max="180"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Session will automatically close after this time
                </p>
              </div>
            </div>

            <button
              onClick={openAttendanceSession}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Opening Session...' : '🟢 Open Attendance Session'}
            </button>
          </div>
        )}

        {/* Active Session */}
        {activeSession && (
          <div className={`border-2 rounded-lg p-6 mb-6 ${activeSession.is_open
            ? 'bg-green-50 border-green-500'
            : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className={`text-2xl font-bold ${activeSession.is_open ? 'text-green-800' : 'text-gray-800'
                  }`}>
                  {activeSession.is_open ? '🟢 Attendance Session Active' : '📋 Session Details'}
                </h2>
                <p className={activeSession.is_open ? 'text-green-700' : 'text-gray-600'}>
                  {activeSession.is_open
                    ? `Closes at: ${formatTime(activeSession.closes_at)}`
                    : `Session Date: ${formatDate(activeSession.opened_at)}`
                  }
                </p>
              </div>

              {activeSession.is_open && (
                <button
                  onClick={closeAttendanceSession}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Close Session
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">
                Attendance Records ({attendanceRecords.length} marked)
              </h3>

              {attendanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No students have marked attendance yet...
                </p>
              ) : (
                <div className="space-y-3">
                  {attendanceRecords.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-semibold">{record.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {formatTime(record.marked_at)} • {record.distance_meters.toFixed(1)}m away
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingPhoto(record)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View Photo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {selectedClassroom && sessions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Past Sessions</h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {formatDate(session.opened_at)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.total_marked} students marked •
                      Status: {session.is_open ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  {!session.is_open && (
                    <button
                      onClick={() => {
                        setActiveSession(session);
                        loadAttendanceRecords();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Records
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{viewingPhoto.student_name}</h3>
                <p className="text-sm text-gray-500">
                  {formatTime(viewingPhoto.marked_at)}
                </p>
              </div>
              <button
                onClick={() => setViewingPhoto(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <img
              src={viewingPhoto.photo_base64}
              alt="Attendance Photo"
              className="w-full rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Distance: {viewingPhoto.distance_meters.toFixed(1)}m from classroom center
            </p>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherAttendance;
