import React, { useState, useEffect, useRef } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [classroomId, setClassroomId] = useState('');
  const [session, setSession] = useState(null);
  const [canMark, setCanMark] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    sessionOpen: false,
    ipMatched: false,
    locationValid: false
  });
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasRegisteredIP, setHasRegisteredIP] = useState(false);
  const [registeredIPAddress, setRegisteredIPAddress] = useState(null);
  const [statusReason, setStatusReason] = useState(null); // Added statusReason

  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Register IP on first load
  useEffect(() => {
    checkIPRegistration();
  }, []);

  // Check session every 5 seconds
  useEffect(() => {
    if (!classroomId) return;

    const interval = setInterval(() => {
      checkSession();
    }, 5000);

    // Check immediately
    checkSession();

    return () => clearInterval(interval);
  }, [classroomId]);

  // Start/stop camera based on eligibility
  useEffect(() => {
    // Only start camera if we can mark AND we haven't already captured a photo
    if (canMark && !cameraActive && !capturedPhoto) {
      startCamera();
    } else if ((!canMark || capturedPhoto) && cameraActive) {
      stopCamera();
    }
  }, [canMark, capturedPhoto]);

  const checkIPRegistration = async () => {
    try {
      const response = await attendanceAPI.getStudentStatus();
      setHasRegisteredIP(response.data.is_registered);
      if (response.data.registered_ip) {
        setRegisteredIPAddress(response.data.registered_ip);
      }
    } catch (error) {
      console.error('Error checking IP registration:', error);
      // Fallback to false if error, forcing registration attempt which will fail/succeed with proper error
      setHasRegisteredIP(false);
    }
  };

  const registerIP = async () => {
    try {
      setLoading(true);
      await attendanceAPI.bindIP();
      toast.success('Device registered successfully!');
      // Re-check status to confirm
      await checkIPRegistration();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    if (!classroomId) return;

    try {
      const response = await attendanceAPI.checkSession(classroomId);
      const data = response.data;

      setSession(data.session);
      setCanMark(data.can_mark);

      setValidationStatus({
        sessionOpen: !!data.session,
        ipMatched: data.registered_ip === data.current_ip, // Check IP match directly
        locationValid: false // Will check when marking
      });

      setStatusReason(data.reason); // Store the reason

      if (data.reason && !data.can_mark) {
        // Don't show toast repeatedly
        // console.log(data.reason);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

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
    if (!videoRef.current || videoRef.current.readyState !== 4) { // HAVE_ENOUGH_DATA
      console.warn("Video not ready for capture");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoBase64);
    // Camera will stop automatically via useEffect when capturedPhoto is set
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    // Camera will start automatically via useEffect when capturedPhoto is null
  };

  const markAttendance = async () => {
    if (!canMark) {
      toast.error('Cannot mark attendance. Check requirements.');
      return;
    }

    if (!capturedPhoto) {
      toast.error('Please capture a photo first.');
      return;
    }

    try {
      setLoading(true);

      // Get current location
      toast.loading('Getting your location...');
      const position = await getCurrentLocation();

      // Submit attendance
      toast.dismiss();
      toast.loading('Submitting attendance...');

      await attendanceAPI.markAttendance({
        session_id: session._id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        photo: capturedPhoto
      });

      toast.dismiss();
      toast.success('Attendance marked successfully! ✅');

      // Clear state
      setCanMark(false);
      setCapturedPhoto(null);

      // Refresh status immediately
      await checkSession();
      await checkIPRegistration();

    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || 'Failed to mark attendance';
      toast.error(errorMsg);
      console.error('Attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>

        {/* Step 1: Register IP */}
        <div className={`bg-white rounded-lg shadow p-6 mb-6 transition-opacity ${hasRegisteredIP ? 'opacity-75' : 'opacity-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Step 1: Register Your Device
                {hasRegisteredIP && <span className="text-green-500 text-sm">✓ Completed</span>}
              </h2>
              <p className="text-gray-600 mb-4">
                {hasRegisteredIP
                  ? `Device registered successfully. IP: ${registeredIPAddress}`
                  : "Register the device you will use for attendance. ⚠️ This is a ONE-TIME process and cannot be changed."}
              </p>
            </div>
          </div>

          {!hasRegisteredIP && (
            <button
              onClick={registerIP}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Device (Permanent)'}
            </button>
          )}
        </div>

        {/* Step 2: Enter Classroom ID */}
        {hasRegisteredIP && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold mb-4">Step 2: Enter Classroom</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                placeholder="Enter Classroom ID"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={checkSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Check Session
              </button>
            </div>
          </div>
        )}

        {/* Session Status */}
        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${validationStatus.sessionOpen ? 'text-green-500' : 'text-gray-300'}`}>
                  {validationStatus.sessionOpen ? '✅' : '❌'}
                </span>
                <span className="text-lg">
                  Session is Open
                  {session.closes_at && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Closes at {new Date(session.closes_at).toLocaleTimeString()})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-2xl ${validationStatus.ipMatched ? 'text-green-500' : 'text-red-500'}`}>
                  {validationStatus.ipMatched ? '✅' : '❌'}
                </span>
                <span className="text-lg">
                  Device Verified
                  {!validationStatus.ipMatched && (
                    <span className="text-sm text-red-500 ml-2">
                      (Please use your registered device)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl text-blue-500">📍</span>
                <span className="text-lg">
                  Location will be verified when you submit
                  {session.radius_meters && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Within {session.radius_meters}m)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Camera and Capture */}
        {canMark && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {capturedPhoto ? 'Review Photo' : 'Capture Your Photo'}
            </h2>

            <div className="mb-4 relative">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full max-w-2xl mx-auto rounded-lg border-4 border-green-500"
                  style={{ minHeight: '300px', objectFit: 'cover' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-2xl mx-auto rounded-lg border-4 border-blue-500 bg-black"
                  style={{ minHeight: '300px' }}
                />
              )}

              {!capturedPhoto && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                  REC
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {!capturedPhoto ? (
                <button
                  onClick={capturePhoto}
                  className="px-8 py-4 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span className="text-2xl">📸</span> Capture Photo
                </button>
              ) : (
                <>
                  <button
                    onClick={retakePhoto}
                    disabled={loading}
                    className="px-6 py-4 bg-gray-500 text-white text-lg rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    Retake
                  </button>
                  <button
                    onClick={markAttendance}
                    disabled={loading}
                    className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Submit Attendance <span className="text-2xl">✅</span>
                  </button>
                </>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Make sure your face is clearly visible in the frame
            </p>
          </div>
        )}

        {/* Waiting state */}
        {!canMark && session && (
          <div className={`border rounded-lg p-6 text-center ${statusReason?.includes('already marked')
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
            }`}>
            <p className={`text-lg font-medium ${statusReason?.includes('already marked') ? 'text-green-800' : 'text-yellow-800'
              }`}>
              {statusReason || (validationStatus.ipMatched
                ? 'Waiting for teacher to open attendance...'
                : 'Please use your registered device to mark attendance')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
