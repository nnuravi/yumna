import { useState } from 'react'
import { Button } from '../../components/ui/button'

const HERO =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1500&q=85'

const STATS = [
  { value: 'SAR 2.4B+', label: 'Credit underwritten' },
  { value: '<3 min', label: 'Avg. decision time' },
  { value: '99.2%', label: 'Repayment accuracy' },
]

export default function LoginScreen({ onLogin, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin?.({ username, password })
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-white">
      {/* ── Left: hero visual ─────────────────────────────── */}
      <div className="relative hidden overflow-hidden md:block md:w-[55%] lg:w-[58%]">
        <img
          src={HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Brand-tinted overlay + bottom vignette for legibility */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(40,33,90,0.78), rgba(144,132,253,0.40)), linear-gradient(180deg, rgba(17,17,26,0.05) 40%, rgba(17,17,26,0.62) 100%)',
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <img src="/logo-mark.svg" alt="Yumna" className="h-9 w-auto" />

          <div>
            <h2 className="display max-w-xl text-3xl leading-tight text-white lg:text-[2.6rem]">
              Smarter credit decisions, powered by AI.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
              Underwrite faster, manage risk with confidence, and unlock growth
              across your entire portfolio.
            </p>

            <div className="mt-10 flex gap-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="display text-2xl text-white">{s.value}</div>
                  <div className="mt-1 text-[12px] text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: login panel ────────────────────────────── */}
      <div className="flex w-full items-center justify-center px-6 sm:px-12 md:w-[45%] lg:w-[42%]">
        <form onSubmit={handleSubmit} className="login-card w-full max-w-sm">
          <img src="/assets/logotype.svg" alt="Yumna" className="mb-10 h-8 w-auto" />

          <h1 className="display text-2xl text-ink">Yumna Login</h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            Sign in to access your workspace
          </p>

          <div className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-[13px] font-semibold text-ink-soft"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-4 text-[14px] text-ink transition placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-semibold text-ink-soft"
                >
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[12px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-4 text-[14px] text-ink transition placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700 font-medium">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full">
            Sign In
          </Button>

          <p className="mt-8 text-center text-[12px] text-muted">
            Protected by enterprise-grade security · Yumna © 2026
          </p>
        </form>
      </div>
    </div>
  )
}
