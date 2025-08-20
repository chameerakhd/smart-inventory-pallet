import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Squares2X2Icon,
  CubeIcon,
  TruckIcon,
  PercentBadgeIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      icon: <Squares2X2Icon className="w-5 h-5" />,
      label: "Dashboard",
      url: "/",
    },
    {
      icon: <CubeIcon className="w-5 h-5" />,
      label: "Stock",
      url: "/inventory-management",
    },
    {
      icon: <TruckIcon className="w-5 h-5" />,
      label: "Loading",
      hasDropdown: false,
      url: "/loading-management",
    },
    {
      icon: <PercentBadgeIcon className="w-5 h-5" />,
      label: "Discounts",
      url: "/discounts",
    },

    {
      icon: <TagIcon className="w-5 h-5" />,
      label: "Promotions",
      url: "/promotions",
    },
    
    {
      icon: <CreditCardIcon className="w-5 h-5" />,
      label: "Credits",
      url: "/credits",
    },
    {
      icon: <DocumentChartBarIcon className="w-5 h-5" />,
      label: "Reports",
      url: "/reports",
    },
    {
      icon: <UserGroupIcon className="w-5 h-5" />,
      label: "Manage",
      url: "/manage",
    },
  ];

  const bottomMenuItems = [
    {
      icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
      label: "Help",
      url: "/help",
    },
  ];

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <div
      className={`bg-white flex flex-col shadow h-full relative transition-all duration-300 pt-20 ${
        isCollapsed ? "w-16" : "w-52"
      }`}
    >
      {/* Toggle button */}
      <button
        className="absolute -right-3 top-[76px] bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Logo section - uncomment if needed
      <div className="p-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-blue-400">
            {isCollapsed ? "C" : "C&H"}
          </span>
        </div>
        {!isCollapsed && (
          <div className="text-blue-400 font-semibold">DISTRIBUTORS</div>
        )}
      </div> */}

      <nav className="flex-1 mt-4">
        <ul>
          {menuItems.map((item, index) => {
            let isActive = location.pathname === item.url;
            if (location.pathname === "/dashboard") {
              isActive = item.url === "/";
            }

            return (
              <li key={index}>
                <a
                  href={item.url}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.url);
                  }}
                  className={`flex items-center px-4 py-3 hover:bg-gray-100 rounded-r-lg transition ${
                    isActive
                      ? "bg-blue-100 text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                  title={isCollapsed ? item.label : ""}
                >
                  <span className={isCollapsed ? "mx-auto" : "mr-3"}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && item.hasDropdown && (
                    <span className="ml-auto">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t mt-auto">
        <ul>
          {bottomMenuItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.url);
                }}
                className="flex items-center px-4 py-3 hover:bg-gray-100"
                title={isCollapsed ? item.label : ""}
              >
                <span className={isCollapsed ? "mx-auto" : "mr-3"}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </a>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 hover:bg-gray-100 w-full text-left"
              title={isCollapsed ? "Logout" : ""}
            >
              <span className={isCollapsed ? "mx-auto" : "mr-3"}>
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
