import { useState, useEffect, useRef } from 'react';
import { engagementAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const useTabDetection = (studentId, activityType, activityId) => {
    const [isFlagged, setIsFlagged] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [warning, setWarning] = useState(null);

    // Refs for state that shouldn't trigger re-renders inside event listener
    const countRef = useRef(0);
    const timerRef = useRef(null);
    const isFlaggedRef = useRef(false);

    const MAX_SWITCHES = 2;
    const MAX_TIME_AWAY_MS = 4000;

    useEffect(() => {
        // Prevent re-attaching if already flagged
        if (isFlagged) return;

        const report = async (reason) => {
            if (isFlaggedRef.current) return;
            isFlaggedRef.current = true;
            setIsFlagged(true);

            // Report violation to backend
            try {
                console.log(`[TAB DETECTION] Violation: ${reason}`);
                await engagementAPI.reportViolation({
                    student_id: studentId,
                    activity_type: activityType,
                    activity_id: activityId,
                    violation_type: 'TAB_SWITCH',
                    description: reason,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error("Failed to report violation:", error);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User LEFT the tab
                countRef.current += 1;
                setViolationCount(countRef.current);

                // Check Frequency Threshold
                if (countRef.current >= MAX_SWITCHES) {
                    report(`Exceeded tab switch limit (${countRef.current}/${MAX_SWITCHES})`);
                    return;
                }

                // Warn user
                const strikesLeft = MAX_SWITCHES - countRef.current;
                toast(`Warning: Tab switching is monitored. ${strikesLeft} attempt(s) remaining.`, { icon: '⚠️' });

                // Start Time Threshold Timer
                timerRef.current = setTimeout(() => {
                    report(`Away for more than ${MAX_TIME_AWAY_MS / 1000} seconds`);
                }, MAX_TIME_AWAY_MS);

            } else {
                // User RETURNED to tab
                // Clear the time-away timer
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [studentId, activityType, activityId, isFlagged]);

    const resetFlag = () => {
        setIsFlagged(false);
        isFlaggedRef.current = false;
        countRef.current = 0;
        setViolationCount(0);
    };

    return { isFlagged, violationCount, resetFlag };
};

export default useTabDetection;
