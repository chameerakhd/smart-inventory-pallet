import React, { useState, useEffect } from "react";
import { logo } from "../assets";

const LoadingComponent = () => {
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  // Simulate content loading after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      closeLoader();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const closeLoader = () => {
    setClosing(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Duration of closing animation
  };

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-white z-50 transition-transform duration-1000 ease-in-out ${
        closing ? "translate-y-full" : ""
      }`}
    >
      <div className={`flex flex-col items-center justify-center`}>
        <div className="w-24 h-24 mb-4 animate-spin">
          <img src={logo} />
        </div>
        <p className="text-lg font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingComponent;
