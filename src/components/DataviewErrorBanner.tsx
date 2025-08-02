import React from 'react';

interface DataviewErrorBannerProps {
  show: boolean;
  message?: string;
}

const DataviewErrorBanner: React.FC<DataviewErrorBannerProps> = ({ 
  show, 
  message = "Dataview plugin is not installed or enabled. Please install and enable the Dataview plugin to use advanced queries." 
}) => {
  if (!show) return null;

  return (
    <div className="dataview-error-banner">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
      </div>
    </div>
  );
};

export default DataviewErrorBanner;