export default function WelcomeScreen() {
  return (
    <div className="app-bg fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Logo + soft brand halo */}
      <div className="relative mb-9 flex items-center justify-center">
        <div
          className="welcome-halo pointer-events-none absolute h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(144,132,253,0.35), transparent 70%)' }}
        />
        <img
          src="/logo-mark.svg"
          alt="Yumna"
          className="welcome-logo relative h-28 w-auto drop-shadow-sm"
        />
      </div>

      <h1 className="welcome-fade-1 display text-center text-4xl text-ink sm:text-5xl">
        Welcome to Yumna
      </h1>
      <p className="welcome-fade-2 mt-3.5 max-w-md text-center text-[15px] text-ink-soft">
        AI-powered credit intelligence and risk management platform
      </p>

      {/* Determinate loading bar */}
      <div className="welcome-fade-2 mt-11 h-1 w-48 overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className="welcome-progress h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-primary), #6a7bff)' }}
        />
      </div>
    </div>
  )
}
