import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Zap } from "lucide-react";
import menu from "./menu";
import { useAuthStore } from "../../store/authStore";
import Popup from "../popup"; // adjust path to match your project structure

const DesktopMenu = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleConfirmLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="hidden lg:flex w-60 fixed left-0 top-0 h-screen flex-col z-40 bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(15,23,42,0.04)]">
      {/* Top indigo stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />

      {/* Logo */}
      <div className="shrink-0 px-[18px] pt-7 pb-5 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[14.5px] font-black text-slate-900 tracking-tight leading-none">
              LabPilot<span className="text-indigo-500 font-medium">Pro</span>
            </p>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Health Management</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden px-2.5 py-2">
        <div className="flex flex-col gap-0.5">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path === "/"} className="no-underline">
                {({ isActive }) => (
                  <div
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150
                    ${
                      isActive
                        ? "bg-indigo-50 border border-indigo-200"
                        : "border border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-[22%] bottom-[22%] w-[3px] bg-gradient-to-b from-indigo-500 to-indigo-400 rounded-r-full" />
                    )}

                    <div
                      className={`w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center border transition-colors duration-150
                      ${
                        isActive
                          ? "bg-indigo-100 border-indigo-200"
                          : "bg-slate-50 border-slate-200 group-hover:bg-white group-hover:border-indigo-200"
                      }`}
                    >
                      <Icon
                        size={14}
                        className={`transition-colors duration-150 ${isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-500"}`}
                      />
                    </div>

                    <span
                      className={`flex-1 text-[13px] tracking-[-0.2px] transition-colors duration-150
                      ${isActive ? "font-bold text-indigo-900" : "font-medium text-slate-500 group-hover:text-slate-800"}`}
                    >
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]" />
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <div className="shrink-0 border-t border-slate-50 px-2.5 pt-2 pb-3.5">
        <button
          onClick={() => setShowLogoutPopup(true)}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-red-50 hover:border-red-100 transition-all duration-150 cursor-pointer bg-transparent"
        >
          <div className="w-8 h-8 rounded-[9px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <LogOut size={13} className="text-red-400" />
          </div>
          <span className="text-[13px] font-medium text-slate-400 group-hover:text-red-500 transition-colors duration-150">
            Log Out
          </span>
        </button>
      </div>

      {showLogoutPopup && (
        <Popup
          type="logout"
          message="Are you sure you want to log out?"
          confirmText="Log Out"
          cancelText="Cancel"
          onConfirm={handleConfirmLogout}
          onClose={() => setShowLogoutPopup(false)}
        />
      )}
    </nav>
  );
};

export default DesktopMenu;