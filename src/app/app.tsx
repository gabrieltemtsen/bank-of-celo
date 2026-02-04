"use client";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden announcement-page">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl text-center space-y-8">
        {/* Logo/Icon */}
        <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/25">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-white"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Main text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Something
            <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent"> Amazing </span>
            is Coming
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
            We&apos;re working on something cool. Stay tuned for the big reveal!
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Subtle footer */}
        <p className="text-sm text-gray-500 pt-12">
          Bank of Celo • Coming Soon
        </p>
      </div>
    </div>
  );
}
