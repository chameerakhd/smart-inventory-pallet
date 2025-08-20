import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_icon.png";
import NotificationDropdown from "./Notification/NotificationDropdown";
import { useNotifications } from "./Notification/NotificationContext";
import {
  BellIcon,
  PencilIcon,
  UserIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArchiveBoxIcon,
  TagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const Header = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const { notifications } = useNotifications();
    
  // Count unread notifications
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef, notificationRef]);

  const navItems = [
    {
      title: "Loading Transaction",
      icon: <ArrowUpTrayIcon className="h-5 w-5" />,
      path: "/loading-management?tab=loading",
      color: "bg-blue-100 text-blue-600",
      hoverColor: "bg-blue-200",
    },
    {
      title: "Unloading Transaction",
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      path: "/loading-management?tab=unloading",
      color: "bg-purple-100 text-purple-600",
      hoverColor: "bg-purple-200",
    },
    {
      title: "Add New Stock",
      icon: <ArchiveBoxIcon className="h-5 w-5" />,
      path: "/inventory-management?tab=add-new-stock",
      color: "bg-green-100 text-green-600",
      hoverColor: "bg-green-200",
    },
    {
      title: "Manage Lorry",
      icon: <TruckIcon className="h-5 w-5" />,
      path: "/manage?tab=lorry",
      color: "bg-amber-100 text-amber-600",
      hoverColor: "bg-amber-200",
    },
    {
      title: "Manage Product",
      icon: <TagIcon className="h-5 w-5" />,
      path: "/manage?tab=product",
      color: "bg-pink-100 text-pink-600",
      hoverColor: "bg-pink-200",
    },
  ];

  return (
    <header className="bg-white py-3 px-6 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 hover:opacity-90 transition-opacity duration-200">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="ZENDEN Logo" className="h-12 w-12 object-contain" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-[#0d8ed6] to-[#0fb493] text-transparent bg-clip-text">
                ZENDEN
              </h1>
              <p className="text-xs bg-gradient-to-r from-[#0d8ed6] to-[#0fb493] text-transparent bg-clip-text tracking-widest">
                DIGITAL SOLUTIONS
              </p>
            </div>
          </Link>
        </div>
        
        <div className="relative flex-1 max-w-md mx-auto">
          <div className={`relative flex items-center transition-all duration-300 ${searchFocused ? 'ring-2 ring-blue-400' : 'ring-1 ring-gray-200'} rounded-full bg-gray-50 px-2`}>
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 ml-2" />
            <input
              type="text"
              className="block w-full pl-2 pr-4 py-2.5 bg-transparent focus:outline-none text-sm"
              placeholder="Search for anything"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-5 ml-4">
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#0fb493] to-[#036c57] text-white rounded-full text-sm font-medium shadow hover:shadow-md transition-all duration-200 hover:translate-y-[1px]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              <span>Create</span>
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-10 overflow-hidden border border-gray-100 transform transition-all duration-200">
                <div className="px-5 py-4 flex justify-between items-center bg-gradient-to-r from-[#0fb493] to-[#036c57]">
                  <h3 className="text-base font-bold text-white">
                    Quick Navigation
                  </h3>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-3 grid grid-cols-1 gap-2">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.path}
                      className="group flex items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className={`mr-4 rounded-full p-2.5 ${item.color} transition-all duration-200 group-hover:scale-110`}>
                        {item.icon}
                      </span>
                      <div>
                        <span className="text-gray-800 font-medium block">{item.title}</span>
                        <span className="text-xs text-gray-500">Manage your {item.title.toLowerCase()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div ref={notificationRef} className="relative">
            <button 
              className="relative p-1 rounded-full transition-all duration-200 focus:outline-none group"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isNotificationOpen ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'}`}>
                <BellIcon className={`h-5 w-5 ${isNotificationOpen ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-500'}`} />
              </div>
              
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-10 overflow-hidden border border-gray-100 animate-fade-in-down">
                <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
              </div>
            )}
          </div>
          
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-blue-50 transition-colors duration-150">
            <PencilIcon className="h-5 w-5 text-gray-600 hover:text-blue-500" />
          </button>
          
          <div className="relative group">
            <button className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white flex items-center justify-center ring-4 ring-gray-100 hover:ring-gray-200 transition-all duration-200">
              <UserIcon className="h-5 w-5" />
            </button>
            
            {user && onLogout && (
              <div className="absolute right-0 mt-2 w-48 hidden group-hover:block">
                <div className="bg-white shadow-xl rounded-xl p-2 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name || "User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || ""}</p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;