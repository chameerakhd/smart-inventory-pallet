import React from "react";
import LoginForm from "../components/LoginForm";
import { login_background } from "../assets";
import logo from "../assets/logo_icon.png";

const LoginPage = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="m-auto w-full max-w-5xl flex overflow-hidden gap-6">
        <div className="w-full md:w-2/5 p-8 flex flex-col justify-center border-3 border-gray-200 rounded-3xl text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src={logo} alt="Zenden Logo" className="w-20 h-20" />
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0d8ed6] to-[#0fb493] text-transparent bg-clip-text">
                ZENDEN
              </h1>
              <p className="bg-gradient-to-r from-[#0d8ed6] to-[#0fb493] text-transparent bg-clip-text font-medium text-xs tracking-widest">
                DIGITAL SOLUTIONS
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-24">Inventory Management System</p>
          <LoginForm />
        </div>
        <div className="hidden md:block md:w-3/5">
          <img
            src={login_background}
            alt="Inventory Management Illustration"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
