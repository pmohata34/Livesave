import React, { useState } from "react";
import { Lock, Mail, User as UserIcon, ShieldAlert, Sparkles, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface AuthScreenProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getRegisteredUsers = () => {
    const saved = localStorage.getItem("lifesave_registered_users");
    return saved ? JSON.parse(saved) : [];
  };

  const saveRegisteredUsers = (users: any[]) => {
    localStorage.setItem("lifesave_registered_users", JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const users = getRegisteredUsers();

    if (isLogin) {
      // Find user
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (user) {
        setSuccess(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess({ email: user.email, name: user.name });
        }, 800);
      } else {
        // Fallback for default demo account if no users are registered yet
        if (email.toLowerCase() === "demo@lifesave.ai" && password === "demo123") {
          setSuccess("Welcome back, Demo User!");
          setTimeout(() => {
            onLoginSuccess({ email: "demo@lifesave.ai", name: "Demo User" });
          }, 800);
          return;
        }
        setError("Invalid email or password.");
      }
    } else {
      // Register user
      if (!name) {
        setError("Please enter your name.");
        return;
      }

      const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (exists || email.toLowerCase() === "demo@lifesave.ai") {
        setError("This email is already registered.");
        return;
      }

      const newUser = {
        email: email.toLowerCase(),
        name,
        password,
        joinedAt: new Date().toISOString(),
      };

      saveRegisteredUsers([...users, newUser]);
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        onLoginSuccess({ email: newUser.email, name: newUser.name });
      }, 1000);
    }
  };

  const handleQuickDemo = () => {
    // Fill in default demo login details and submit
    setEmail("demo@lifesave.ai");
    setPassword("demo123");
    setIsLogin(true);
    setSuccess("Welcome back, Demo User!");
    setTimeout(() => {
      onLoginSuccess({ email: "demo@lifesave.ai", name: "Demo User" });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      
      {/* Slithering ambient colorful glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="relative w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-blue-500 to-violet-600 rounded-full animate-revolve opacity-60 blur-[3px]" />
            <div className="absolute w-9 h-9 bg-[#030303] rounded-full flex items-center justify-center">
              <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl font-title font-black uppercase tracking-tight text-white bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            LifeSave AI
          </h1>
          <p className="text-[10px] text-cyan-400 font-mono font-bold tracking-widest uppercase mt-1">
            THE LAST-MINUTE CRISIS SHIELD & AI PLANNER
          </p>
        </div>

        {/* Main Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full bg-zinc-950/80 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.05)]"
        >
          {/* Card Title */}
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h2 className="text-sm font-mono font-black uppercase tracking-wider text-zinc-300">
              {isLogin ? "SIGN IN TO YOUR ACCOUNT" : "CREATE NEW ACCOUNT"}
            </h2>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors"
            >
              {isLogin ? "SIGN UP INSTEAD" : "SIGN IN INSTEAD"}
            </button>
          </div>

          {/* Feedback states */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/5 border border-red-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-sans text-red-200">{error}</div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-cyan-500/5 border border-cyan-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-2.5"
            >
              <Sparkles className="w-4.5 h-4.5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs font-sans text-cyan-200">{success}</div>
            </motion.div>
          )}

          {/* Core Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  FULL NAME
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                PASSWORD
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-xs font-sans text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-xs font-sans text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 px-4 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-400/20 hover:scale-[1.01] mt-6"
            >
              <span>{isLogin ? "SIGN IN" : "CREATE ACCOUNT"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Section */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
              WANT A QUICK TRIAL?
            </p>
            <button
              onClick={handleQuickDemo}
              className="text-xs font-mono font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-950/40 hover:border-cyan-500/40 py-2.5 px-4 rounded-xl uppercase tracking-widest transition-all duration-300 inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>TRY DEMO ACCOUNT</span>
            </button>
          </div>
        </motion.div>

        {/* Dynamic decorative prompt info */}
        <p className="text-[9px] font-mono text-zinc-600 text-center uppercase tracking-widest mt-6">
          YOUR SESSION IS SECURED & SAVED LOCALLY
        </p>
      </div>
    </div>
  );
}
