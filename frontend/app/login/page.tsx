"use client";

import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/Background3D"), {
  ssr: false,
});

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AuthRedirect from "@/components/AuthRedirect";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Tilt Animation Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    e.currentTarget.style.setProperty("--x", `${mouseX}px`);
    e.currentTarget.style.setProperty("--y", `${mouseY}px`);

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRedirect>
      <Background3D />
      <main className="flex items-center justify-center h-screen font-sans overflow-hidden">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateY,
            rotateX,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-6 relative"
        >
          {/* Cursor Glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-sm"
            style={{
              background:
                "radial-gradient(circle at var(--x) var(--y), rgba(220,38,38,0.15), transparent 40%)",
            }}
          />

          {/* Card Glassmorphism Effect - UPDATED TO DARK MODE */}
          <div
            style={{ transform: "translateZ(50px)" }}
            className="bg-[#111111]/95 backdrop-blur-xl border border-gray-800/60 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm border-t-4 border-red-600"
          >
            <div
              className="mb-10 select-none"
              style={{ transform: "translateZ(30px)" }}
            >
              <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl font-extrabold tracking-tight"
              >
                <span className="bg-[linear-gradient(110deg,#dc2626,45%,#ef4444,55%,#dc2626)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_4s_linear_infinite]">
                  Breach
                </span>

                {/* UPDATED TEXT COLOR */}
                <span className="text-white mx-1">@</span>
                <span className="text-white font-black">trix</span>
              </motion.h1>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 140 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="h-[2px] bg-red-600 mt-3 rounded-full"
              />

              <p className="text-xs tracking-[0.35em] text-gray-400 mt-2 uppercase">
                Ordin@trix 26'
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div style={{ transform: "translateZ(20px)" }}>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Innovator ID
                </label>

                {/* UPDATED INPUT STYLES */}
                <input
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-md
    text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/30
    outline-none transition-all duration-200
    placeholder:text-gray-600"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div style={{ transform: "translateZ(20px)" }}>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Auth Key
                </label>

                {/* UPDATED INPUT STYLES */}
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-md
    text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/30
    outline-none transition-all duration-200
    placeholder:text-gray-600"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                disabled={loading}
                style={{ transform: "translateZ(40px)" }}
                className="w-full relative overflow-hidden rounded-md
  bg-gradient-to-r from-slate-900 to-black border border-gray-800/50
  text-white py-4 font-semibold uppercase tracking-widest
  shadow-lg hover:shadow-red-500/20
  transition-all duration-300 disabled:opacity-50"
              >
                <span className="relative z-10">
                  {loading ? "Authenticating..." : "Enter the System"}
                </span>

                <span
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition duration-300
    bg-gradient-to-r from-red-600 to-red-500"
                />
              </motion.button>
            </form>

            <div
              className="mt-8 pt-6 border-t border-gray-800 text-center space-y-3"
              style={{ transform: "translateZ(10px)" }}
            >
              <p className="text-xs text-gray-500">
                New?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="font-semibold text-red-600 hover:text-red-500 transition-colors relative group"
                >
                  Create an account
                  <span className="absolute left-0 -bottom-[2px] h-[1px] w-0 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </AuthRedirect>
  );
}
