import React, { useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NotificationProvider } from "./components/Notification/NotificationContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import InventoryManagementPage from "./pages/InventoryManagementPage";
import LoadingManagementPage from "./pages/LoadingManagementPage";
import InventoryReportsPage from "./pages/InventoryReportsPage";
import ManagementPage from "./pages/ManagementPage";
import DiscountManagementPage from "./pages/DiscountManagementPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import LoadingComponent from "./components/LoadingComponent";
import CreditManagementPage from "./pages/CreditManagementPage";

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { currentUser } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="flex h-screen bg-blue-1 relative">
      <LoadingComponent />
      {isAdmin && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
      )}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}
      >
        <div className="absolute inset-0 max-h-min">
          <Header isSidebarCollapsed={isSidebarCollapsed} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 mt-[76px]">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with layout */}
            <Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/dashboard"
                  element={
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  }
                />
              </Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/inventory-management"
                  element={
                    <AppLayout>
                      <InventoryManagementPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route
                element={<ProtectedRoute requiredRoles={["admin", "loader"]} />}
              >
                <Route
                  path="/loading-management"
                  element={
                    <AppLayout>
                      <LoadingManagementPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/credits"
                  element={
                    <AppLayout>
                      <CreditManagementPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/discounts"
                  element={
                    <AppLayout>
                      <DiscountManagementPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/reports"
                  element={
                    <AppLayout>
                      <InventoryReportsPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                <Route
                  path="/manage"
                  element={
                    <AppLayout>
                      <ManagementPage />
                    </AppLayout>
                  }
                />
              </Route>
              <Route
                path="/unauthorized"
                element={
                  <AppLayout>
                    <UnauthorizedPage />
                  </AppLayout>
                }
              />
              {/* Add more protected routes here */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
