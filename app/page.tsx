export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex">

      {/* Sidebar */}
      <aside className="w-[290px] border-r border-white/10 bg-[#050b1f] p-6">

        <div className="flex items-center gap-3 mb-10">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-black font-black text-2xl">
            R
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-wide">
              RIVALO
            </h1>

            <p className="text-cyan-300 text-sm tracking-[0.3em]">
              OWN THE GAME
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-4 text-left font-bold shadow-2xl shadow-cyan-500/20">
            Dashboard
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Gruppi
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Match
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Classifica
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Community
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Eventi
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 transition">
            Profilo
          </button>
        </nav>
      </aside>

      {/* Main */}
      <section className="flex-1 p-10">

        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-[#111827] to-[#060b18] p-8 shadow-[0_0_60px_rgba(0,255,255,0.12)]">

          <div className="flex items-center justify-between mb-10">

            <div>
              <h2 className="text-5xl font-black tracking-wide">
                DASHBOARD
              </h2>

              <p className="text-cyan-300 mt-2">
                Benvenuto su Rivalo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-sm text-slate-400">
                RivalScore
              </p>

              <h3 className="text-4xl font-black text-cyan-300">
                83
              </h3>
            </div>
          </div>

          {/* Player Card */}
          <div className="flex gap-10 flex-wrap">

            <div className="relative w-[340px] rounded-[2.5rem] border border-yellow-400/40 bg-gradient-to-br from-[#161616] via-[#101935] to-[#1b0f2f] p-6 shadow-[0_0_60px_rgba(255,208,0,0.25)] overflow-hidden">

              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_55%)]"></div>

              <div className="relative z-10">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-6xl font-black text-yellow-300">
                      83
                    </p>

                    <p className="text-cyan-300 tracking-[0.3em]">
                      RIV
                    </p>
                  </div>

                  <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
                    CALCETTO
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <img
                    src="https://i.pravatar.cc/300"
                    alt="player"
                    className="h-36 w-36 rounded-3xl object-cover border-4 border-white/20"
                  />
                </div>

                <div className="mt-6 text-center">
                  <h3 className="text-5xl font-black text-yellow-300">
                    SAMUELE
                  </h3>

                  <p className="text-xl text-slate-300 tracking-[0.2em]">
                    SAMPON
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 text-center">

                  <div>
                    <p className="text-3xl font-black text-yellow-300">
                      79
                    </p>

                    <p className="text-slate-400">
                      PAC
                    </p>
                  </div>

                  <div>
                    <p className="text-3xl font-black text-yellow-300">
                      81
                    </p>

                    <p className="text-slate-400">
                      DRI
                    </p>
                  </div>

                  <div>
                    <p className="text-3xl font-black text-yellow-300">
                      84
                    </p>

                    <p className="text-slate-400">
                      PHY
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex-1 min-w-[320px]">

              <h3 className="text-3xl font-black mb-6">
                AZIONI RAPIDE
              </h3>

              <div className="grid grid-cols-2 gap-6">

                <div className="rounded-[2rem] border border-cyan-400/20 bg-[#0b1225] p-6 shadow-[0_0_40px_rgba(0,255,255,0.12)]">
                  <h4 className="text-2xl font-black text-cyan-300">
                    CREA MATCH
                  </h4>

                  <p className="mt-3 text-slate-400">
                    Organizza una nuova partita.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-purple-400/20 bg-[#0b1225] p-6 shadow-[0_0_40px_rgba(180,0,255,0.12)]">
                  <h4 className="text-2xl font-black text-purple-300">
                    CLASSIFICA
                  </h4>

                  <p className="mt-3 text-slate-400">
                    Controlla il ranking live.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-yellow-400/20 bg-[#0b1225] p-6 shadow-[0_0_40px_rgba(255,208,0,0.12)]">
                  <h4 className="text-2xl font-black text-yellow-300">
                    EVENTI
                  </h4>

                  <p className="mt-3 text-slate-400">
                    Tornei e community.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-pink-400/20 bg-[#0b1225] p-6 shadow-[0_0_40px_rgba(255,0,150,0.12)]">
                  <h4 className="text-2xl font-black text-pink-300">
                    PROFILO
                  </h4>

                  <p className="mt-3 text-slate-400">
                    Personalizza la tua card.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
