import React, { useState, useEffect, useRef } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Clock, MapPin, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const StudentAttendance = () => {
  const { user } = useAuth();

  // State for active sessions list
  const [activeSessions, setActiveSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // State for marking flow
  const [selectedSession, setSelectedSession] = useState(null);
  const [classroomId, setClassroomId] = useState(''); // Fallback input
  const [manualMode, setManualMode] = useState(false);

  const [canMark, setCanMark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasRegisteredIP, setHasRegisteredIP] = useState(false);
  const [registeredIPAddress, setRegisteredIPAddress] = useState(null);
  const [statusReason, setStatusReason] = useState(null);

  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initial Data Load
  useEffect(() => {
    console.log('StudentAttendance mounted');
    checkIPRegistration();
    fetchActiveSessions();
  }, []);

  // Poll for sessions if on list view
  useEffect(() => {
    if (selectedSession || manualMode) return;

    const interval = setInterval(() => {
      fetchActiveSessions(true);
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [selectedSession, manualMode]);

  // Camera Logic
  useEffect(() => {
    if (canMark && !cameraActive && !capturedPhoto) {
      startCamera();
    } else if ((!canMark || capturedPhoto) && cameraActive) {
      stopCamera();
    }
  }, [canMark, capturedPhoto]);

  const checkIPRegistration = async () => {
    try {
      console.log('Checking IP Registration...');
      const response = await attendanceAPI.getStudentStatus();
      console.log('IP Registration Status:', response.data);
      setHasRegisteredIP(response.data.is_registered);
      if (response.data.registered_ip) {
        setRegisteredIPAddress(response.data.registered_ip);
      }
    } catch (error) {
      console.error('Error checking IP registration:', error);
      setHasRegisteredIP(false);
    }
  };

  const registerIP = async () => {
    try {
      setLoading(true);
      console.log('Registering current device IP...');
      await attendanceAPI.bindIP();
      toast.success('Device registered successfully!');
      await checkIPRegistration();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      console.log('Fetching active sessions...');
      const response = await attendanceAPI.getStudentActiveSessions();
      console.log('Active Sessions:', response.data);
      setActiveSessions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch active sessions", error);
      if (!silent) toast.error("Could not load active sessions");
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  // Select a session from the list
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setCanMark(session.can_mark);
    setStatusReason(session.reason);
    setCapturedPhoto(null); // Reset photo
  };

  const handleBackToList = () => {
    setSelectedSession(null);
    setManualMode(false);
    setCanMark(false);
    stopCamera();
    setCapturedPhoto(null);
    fetchActiveSessions(); // Refresh on back
  };

  // Manual Check (Fallback)
  const checkManualSession = async () => {
    if (!classroomId) return;
    try {
      const response = await attendanceAPI.checkSession(classroomId);
      const data = response.data;

      if (!data.session) {
        toast.error(data.reason || "No active session found for this code");
        return;
      }

      handleSelectSession({
        ...data.session,
        classroom_name: 'Manual Entry', // We might not know the name yet if checking by code
        teacher_name: 'Unknown',
        can_mark: data.can_mark,
        reason: data.reason
      });

    } catch (error) {
      console.error('Error checking session:', error);
      toast.error('Failed to check session');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      console.log('Camera started successfully');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Failed to access camera. Please grant camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
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

  const capturePhoto = () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoBase64);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const markAttendance = async () => {
    if (!canMark || !capturedPhoto) return;

    try {
      setLoading(true);
      toast.loading('Getting location...');
      const position = await getCurrentLocation();

      toast.dismiss();
      toast.loading('Submitting...');

      await attendanceAPI.markAttendance({
        session_id: selectedSession._id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        photo: capturedPhoto
      });

      console.log('Attendance marked successfully');

      toast.dismiss();
      toast.success('Attendance marked successfully! ✅');

      // Return to list after successful mark
      setTimeout(handleBackToList, 2000);

    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || 'Failed to mark attendance';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);


  // RENDER HELPERS
  const renderStep = () => {
    // 1. Device Registration (First Time)
    if (!hasRegisteredIP) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center max-w-lg mx-auto mt-10">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Device Registration Required</h2>
          <p className="text-gray-600 mb-6">
            You must register this device to mark attendance. <br />
            <span className="font-bold text-orange-600">This is a one-time process.</span>
          </p>
          <button
            onClick={registerIP}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Registering...' : 'Register This Device'}
          </button>
        </div>
      );
    }

    // 2. Active Session List
    if (!selectedSession && !manualMode) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
              <p className="text-gray-500">Select an active class to mark present.</p>
            </div>
            <button
              onClick={() => fetchActiveSessions()}
              disabled={refreshing}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {activeSessions.length > 0 ? (
            <div className="grid gap-4">
              {activeSessions.map(session => (
                <div
                  key={session._id}
                  onClick={() => handleSelectSession(session)}
                  className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md
                                    ${session.can_mark ? 'border-green-200 hover:border-green-400' : 'border-gray-200 opacity-75'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${session.can_mark ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{session.classroom_name}</h3>
                        <p className="text-sm text-gray-600">{session.teacher_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Ends {new Date(session.closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {session.room && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {session.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!session.can_mark && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                        {session.reason || 'Unavailable'}
                      </span>
                    )}
                    {session.can_mark && (
                      <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full animate-pulse">
                        Open for Attendance
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-600">No Active Sessions</h3>
              <p className="text-gray-400 text-sm mb-6">Attendance is not currently open for any of your classes.</p>
              <button
                onClick={() => setManualMode(true)}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                Enter Class Code Manually
              </button>
            </div>
          )}
        </div>
      );
    }

    // 3. Mark Attendance Flow (Camera)
    if (selectedSession) {
      return (
        <div className="max-w-2xl mx-auto">
          <button onClick={handleBackToList} className="mb-4 text-gray-500 hover:text-gray-800 text-sm font-bold flex items-center gap-1">
            ← Back to Sessions
          </button>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{selectedSession.classroom_name}</h2>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">Instructor: {selectedSession.teacher_name}</p>
              </div>

              {/* Restored Status Block */}
              <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-green-500"><CheckCircle size={20} /></div>
                  <span className="text-gray-700 font-medium">Session is Open</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={(!selectedSession.reason || !selectedSession.reason.includes('IP')) ? "text-green-500" : "text-red-500"}>
                    {(!selectedSession.reason || !selectedSession.reason.includes('IP')) ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <span className={(!selectedSession.reason || !selectedSession.reason.includes('IP')) ? "text-gray-700 font-medium" : "text-red-600 font-medium"}>
                    Device Verified
                    {selectedSession.reason?.includes('IP') && <span className="block text-xs font-normal">Please use your registered device</span>}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-blue-500"><MapPin size={20} /></div>
                  <span className="text-gray-700 font-medium">
                    Location check on submit
                    <span className="text-gray-500 font-normal text-sm ml-1">(Within {selectedSession.radius_meters || 100}m)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {canMark ? (
                <>
                  <div className="mb-6 relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Capture" className="w-full h-full object-cover" />
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )}

                    {!capturedPhoto && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className="bg-red-600 w-3 h-3 rounded-full animate-pulse"></span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    {!capturedPhoto ? (
                      <button
                        onClick={capturePhoto}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all transform active:scale-95 shadow-lg shadow-blue-200"
                      >
                        Capture Photo
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={retakePhoto}
                          disabled={loading}
                          className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          Retake
                        </button>
                        <button
                          onClick={markAttendance}
                          disabled={loading}
                          className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2 transition-all transform active:scale-95"
                        >
                          {loading ? 'Submitting...' : 'Submit Attendance'}
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    Ensure your face fills the frame and location services are enabled.
                  </p>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                    <CheckCircle className="text-gray-400" size={32} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Unavailable</h3>
                  <p className="text-gray-500 text-sm px-8">
                    {statusReason || "You cannot mark attendance for this session at this time."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. Manual Mode (Fallback)
    if (manualMode) {
      return (
        <div className="max-w-md mx-auto mt-10">
          <button onClick={handleBackToList} className="mb-4 text-gray-500 hover:text-gray-800 text-sm font-bold">
            ← Back
          </button>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Enter Class Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                placeholder="e.g. MATH101"
                className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={checkManualSession}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
              >
                Check
              </button>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {renderStep()}
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
