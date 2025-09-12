// src/components/StatCard.tsx
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="stat-card">
      <div className="sc-content">
        <div className="sc-info">
          <p className="sc-title">{title}</p>
          <h3 className="sc-value">{value}</h3>
          {trend && (
            <p
              className={`sc-trend ${
                trend.isPositive ? "positive" : "negative"
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>
        {icon && <div className="sc-icon">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
