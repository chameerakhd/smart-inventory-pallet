import React from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; // If using React Router

const UnauthorizedPage = () => {
  // If using React Router
  const navigate = useNavigate();

  // Function to handle going back
  const handleGoBack = () => {
    // If using React Router
    navigate(-1);

    // Alternative if not using React Router
    // window.history.back();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Unauthorized Access
        </h1>

        <p className="text-gray-600 mb-6">
          Sorry, you don't have permission to view this content. Please contact
          your administrator for access.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Need help? Contact our{" "}
        <a href="#" className="text-blue-600 hover:underline">
          support team
        </a>
        .
      </p>
    </div>
  );
};

export default UnauthorizedPage;
