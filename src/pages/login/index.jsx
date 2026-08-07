import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// ─── Admin Login Page ────────────────────────────────────────────────────────
// Three-factor login: favorite word (env allowlist) + identifier
// (username or phone) + password. No lab key — this app has one tenant.
function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [favoriteWord, setFavoriteWord] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!favoriteWord.trim() || !identifier.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    const result = await login(favoriteWord.trim(), identifier.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4EF] px-4">
      <div className="w-full max-w-sm bg-[#FAF9F5] rounded-[2px] border border-black/10 p-8">
        <h1 className="text-xl font-semibold text-center mb-1">System Admin</h1>
        <p className="text-sm text-black/50 text-center mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="favoriteWord" className="block text-sm font-medium mb-1">
              Favorite Word
            </label>
            <input
              id="favoriteWord"
              type="text"
              autoComplete="off"
              value={favoriteWord}
              onChange={(e) => setFavoriteWord(e.target.value)}
              className="w-full rounded-[2px] border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-[#0F6E5C]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="identifier" className="block text-sm font-medium mb-1">
              Username or Phone
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-[2px] border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-[#0F6E5C]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[2px] border border-black/15 px-3 py-2 pr-16 text-sm focus:outline-none focus:border-[#0F6E5C]"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black/50 hover:text-black"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[2px] bg-[#0F6E5C] text-white text-sm font-medium py-2 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
