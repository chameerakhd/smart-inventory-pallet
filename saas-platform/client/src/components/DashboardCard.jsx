import React from "react";

const DashboardCard = ({ height = "h-full" }) => {
  return (
    <div className={`bg-white rounded-md shadow ${height} w-full`}>
      {/* Card content would go here */}
    </div>
  );
};

export default DashboardCard;
