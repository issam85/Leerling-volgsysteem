
// src/layouts/AdminLayout.js - Layout component voor admin pagina's
import React from 'react';
import { useTrialStatus } from '../hooks/useTrialStatus';
import TrialBanner from '../components/TrialBanner';

const AdminLayout = ({ children, className = '' }) => {
    const { trialStatus, loading } = useTrialStatus();

    return (
        <div className={`admin-layout ${className}`}>
            {/* Trial Banner - alleen tonen als niet loading en er is trial status */}
            {!loading && trialStatus && (
                <TrialBanner trialStatus={trialStatus} />
            )}
            
            {/* Page Content */}
            <div className="admin-content">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;