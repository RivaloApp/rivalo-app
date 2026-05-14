import { Trophy, Users, Zap, Shield, Flame, CalendarDays } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">

        {/* NAVBAR */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-3xl font-black shadow-2xl shadow-cyan-500/30">
              R
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Rivalo
              </h1>

              <p className="text-xs font-bold tracking-[0.3em] text-cyan-300">
                OWN THE GAME
              </p>
            </div>
          </div>

          <button className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20">
            Beta Access
          </button>
        </nav>

        {/* HERO */}
        <div className="mt-24 grid items-center gap-16 lg:grid-cols-2">

          {/* LEFT */}
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
              ⚽ Calcetto • 🎾 Padel • 🏆 Tennis
            </div>

            <h2 className="max-w-3xl text-6xl font-black leading-[0.95] tracking-tight md:text-7xl">
              The competitive sports platform for the next generation.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              Create groups, challenge friends, track rankings, unlock badges and dominate every match with Rivalo.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-black text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:scale-105">
                Start Now
              </button>

              <button className="rounded-2xl border border-white/10 bg-white/10 px-7 py-4 font-black backdrop-blur transition hover:bg-white/20">
                Live Demo
              </button>
            </div>

            {/* STATS */}
            <div className="mt-14 grid grid-cols-3 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="text-3xl font-black text-cyan-300">24K</div>
                <div className="mt-2 text-sm text-slate-400">
                  Matches Played
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="text-3xl font-black text-cyan-300">1.2K</div>
                <div className="mt-2 text-sm text-slate-400">
                  Active Players
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="text-3xl font-black text-cyan-300">92%</div>
                <div className="mt-2 text-sm text-slate-400">
                  Weekly Activity
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MOCKUP */}
          <div className="relative mx-auto w-full max-w-md">

            <div className="absolute inset-0 rounded-[3rem] bg-cyan-400/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">
                    RivalScore
                  </div>

                  <div className="text-5xl font-black text-cyan-300">
                    91
                  </div>
                </div>

                <div className="rounded-2xl bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
                  ON FIRE 🔥
                </div>
              </div>

              {/* CARD */}
              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">
                      Elite Player
                    </div>

                    <div className="mt-1 text-3xl font-black">
                      Antonio
                    </div>
                  </div>

                  <div className="text-5xl">
                    ⚡
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-xl font-black">84</div>
                    <div className="text-xs text-slate-400">WIN</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-xl font-black">95</div>
                    <div className="text-xs text-slate-400">MVP</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-xl font-black">88</div>
                    <div className="text-xs text-slate-400">CHEM</div>
                  </div>
                </div>
              </div>

              {/* FEATURES */}
              <div className="mt-6 space-y-4">

                <div className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
                  <Trophy className="text-cyan-300" />
                  <div>
                    <div className="font-bold">
                      Global Rankings
                    </div>

                    <div className="text-sm text-slate-400">
                      Compete against your friends
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
                  <Users className="text-cyan-300" />
                  <div>
                    <div className="font-bold">
                      Team Chemistry
                    </div>

                    <div className="text-sm text-slate-400">
                      Discover your best duo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
                  <CalendarDays className="text-cyan-300" />
                  <div>
                    <div className="font-bold">
                      Match Calendar
                    </div>

                    <div className="text-sm text-slate-400">
                      Organize games instantly
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section className="mt-32">

          <div className="mb-12 text-center">
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
              FEATURES
            </div>

            <h3 className="text-5xl font-black">
              Built for competitors.
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
              <Shield className="mb-5 text-cyan-300" size={40} />

              <h4 className="text-2xl font-black">
                RivalScore™
              </h4>

              <p className="mt-4 leading-7 text-slate-300">
                Dynamic ranking system based on wins, streaks, MVPs and chemistry.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
              <Zap className="mb-5 text-cyan-300" size={40} />

              <h4 className="text-2xl font-black">
                Dynamic Cards
              </h4>

              <p className="mt-4 leading-7 text-slate-300">
                Level up your player card and unlock exclusive badges and status.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
              <Flame className="mb-5 text-cyan-300" size={40} />

              <h4 className="text-2xl font-black">
                Seasons & Rewards
              </h4>

              <p className="mt-4 leading-7 text-slate-300">
                Monthly competitive seasons with rankings, rewards and legendary status.
              </p>
            </div>

          </div>
        </section>

      </section>
    </main>
  );
}
