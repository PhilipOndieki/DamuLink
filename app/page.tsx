import Link from "next/link";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-brand-red">
              <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            DamuLink
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-white/80 hover:text-white text-sm font-medium transition-colors hidden md:block"
          >
            Dashboard
          </Link>
          <Link
            href="/schedule"
            className="text-white/80 hover:text-white text-sm font-medium transition-colors hidden md:block"
          >
            Schedule
          </Link>
          <Link
            href="/login"
            className="bg-white text-brand-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-brand-red min-h-[88vh] flex items-center relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 5C18 18 8 24 8 34a22 22 0 0044 0c0-10-10-16-22-29z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold uppercase tracking-wider">
              Live in Kenya
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-none tracking-tight mb-6">
            Stop Wasting
            <br />
            Blood.
            <br />
            <span className="text-white/80">Save Lives.</span>
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            Kenya wastes{" "}
            <span className="text-white font-bold">62,000 screened blood units</span>{" "}
            every year. DamuLink matches expiring units to hospitals that need
            them — before it is too late.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-red px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors shadow-lg"
            >
              Register Your Facility
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-white/10 transition-colors"
            >
              View Live Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-900 py-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6 md:gap-12">
          <div className="text-center">
            <AnimatedCounter
              target={3840}
              suffix="+"
              className="text-3xl md:text-4xl font-extrabold text-white"
            />
            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium uppercase tracking-wider">
              Units Matched
            </p>
          </div>
          <div className="text-center">
            <AnimatedCounter
              target={1280}
              suffix="+"
              className="text-3xl md:text-4xl font-extrabold text-brand-red"
            />
            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium uppercase tracking-wider">
              Lives Impacted
            </p>
          </div>
          <div className="text-center">
            <AnimatedCounter
              target={47}
              className="text-3xl md:text-4xl font-extrabold text-white"
            />
            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium uppercase tracking-wider">
              Facilities Connected
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-center">
            How DamuLink Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            A three-step process that turns expiring inventory into saved lives.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Log Expiring Units",
                desc: "Facilities add blood units with expiry timestamps. The system monitors stock levels in real time.",
                icon: "🩸",
              },
              {
                step: "02",
                title: "Instant Matching",
                desc: "Our algorithm ranks recipients by proximity, urgency, and surgical schedule — returning top matches in seconds.",
                icon: "⚡",
              },
              {
                step: "03",
                title: "SMS Confirmation",
                desc: "Both facility managers receive an SMS. Reply YES to confirm. The unit is dispatched before it expires.",
                icon: "📱",
              },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="relative pl-6">
                <div className="absolute left-0 top-0 text-xs font-bold text-brand-red">
                  {step}
                </div>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-10 px-6 md:px-12 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">DamuLink</span>
          </div>
          <p className="text-gray-400 text-sm">
            Reducing blood wastage in Kenya. Built with urgency.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/schedule" className="hover:text-gray-900 transition-colors">
              Schedule
            </Link>
            <Link href="/admin" className="hover:text-gray-900 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
