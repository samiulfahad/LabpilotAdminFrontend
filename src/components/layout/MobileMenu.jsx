import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, ChevronRight, Zap } from "lucide-react";
import menu from "./menu";
import { useAuthStore } from "../../store/authStore";
import Popup from "../popup"; // adjust path to match your project structure

const MobileMenu = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.pageYOffset;
      setScrolled(cur > 10);
      if (cur <= 0) {
        setScrollDirection("");
        return;
      }
      setScrollDirection(cur > lastScroll ? "down" : "up");
      setLastScroll(cur);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const hidden = scrollDirection === "down";

  const handleConfirmLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="lg:hidden">
        {/* Top indigo stripe */}
        <div
          className={`fixed top-0 left-0 right-0 h-[3px] z-[51] bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300 transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
        />

        {/* Navbar */}
        <nav
          className={`fixed top-0 left-0 right-0 py-10 z-50 flex items-center justify-between px-[18px] h-14 border-b border-slate-100 transition-all duration-300
          ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(99,102,241,0.07)]" : "bg-white"}
          ${hidden ? "-translate-y-full" : "translate-y-0"}`}
        >
          <Link to="/" className="no-underline flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13.5px] font-black text-slate-900 tracking-tight leading-none">
                LabPilot<span className="text-indigo-500 font-medium">Pro</span>
              </p>
              <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Health Mgmt</p>
            </div>
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer
              ${isMenuOpen ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
          >
            {isMenuOpen ? <X size={20} className="text-indigo-500" /> : <Menu size={20} className="text-slate-500" />}
          </button>
        </nav>

        {/* Spacer */}
        <div className="h-14" />
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm animate-[overlayIn_0.2s_ease]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[86vw] flex flex-col bg-white border-l border-slate-100 shadow-[-12px_0_50px_rgba(15,23,42,0.08)] transition-transform duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isMenuOpen ? "translate-x-0" : "translate-x-[105%]"}`}
      >
        {/* Top stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />

        {/* Drawer header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-7 pb-[18px] border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none">
                LabPilot<span className="text-indigo-500 font-medium">Pro</span>
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Professional Edition
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
          >
            <X size={13} className="text-slate-400" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.14em] px-2.5 mb-2">Menu</p>
          <div className="flex flex-col gap-0.5">
            {menu.map((item, i) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setIsMenuOpen(false)}
                  className="no-underline"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {({ isActive }) => (
                    <div
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                      ${isActive ? "bg-indigo-50 border-indigo-200" : "border-transparent"}`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-[22%] bottom-[22%] w-[3px] bg-gradient-to-b from-indigo-500 to-indigo-400 rounded-r-full" />
                      )}

                      <div
                        className={`w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center border
                        ${isActive ? "bg-indigo-100 border-indigo-200" : "bg-slate-50 border-slate-200"}`}
                      >
                        <Icon size={14} className={isActive ? "text-indigo-500" : "text-slate-400"} />
                      </div>

                      <span
                        className={`flex-1 text-[13.5px] tracking-[-0.2px]
                        ${isActive ? "font-bold text-indigo-900" : "font-medium text-slate-500"}`}
                      >
                        {item.label}
                      </span>

                      <ChevronRight size={13} className={isActive ? "text-indigo-400" : "text-slate-200"} />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Sign out */}
        <div className="shrink-0 border-t border-slate-50 px-3 pt-2 pb-3.5">
          <button
            onClick={() => setShowLogoutPopup(true)}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer bg-transparent"
          >
            <div className="w-[34px] h-[34px] rounded-[9px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <LogOut size={13} className="text-red-400" />
            </div>
            <span className="text-[13px] font-medium text-slate-400 group-hover:text-red-500 transition-colors">
              Sign Out
            </span>
          </button>
        </div>
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

      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

export default MobileMenu;
