// hooks/useTrialStatus.js
import { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export const useTrialStatus = () => {
    const [trialStatus, setTrialStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchTrialStatus = async () => {
            try {
                const response = await apiCall('/api/trial/status');
                setTrialStatus(response);
            } catch (error) {
                console.error('Error fetching trial status:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchTrialStatus();
    }, []);
    
    return { trialStatus, loading };
};