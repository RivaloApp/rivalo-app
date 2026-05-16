import Link from "next/link";
import RivaloLogo from "../components/RivaloLogo";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarDays,
  MessageCircle,
  User,
  MapPin,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex">
      
      {/* Sidebar */}
      <aside className="w-[290px] border-r border-white/10 bg-[#050b1f] p-6">
        
        {/* LOGO */}
        <div className="mb-10">
          <RivaloLogo />
        </div>

        {/* Menu */}
        <nav className="space-y-4">
          <SidebarItem
            icon={<LayoutDashboard size={22} />}
            label="Dashboard"
            active
          />

          <SidebarItem
            icon={<Users size={22} />}
            label="Gruppi"
          />

          <SidebarItem
            icon={<MapPin size={22} />}
            label="Match"
          />

          <SidebarItem
            icon={<Trophy size={22} />}
            label="Classifica"
          />

          <SidebarItem
            icon={<MessageCircle size={22} />}
            label="Community"
          />

          <SidebarItem
            icon={<CalendarDays size={22} />}
            label="Eventi"
          />

          <Link href="/profile">
            <SidebarItem
              icon={<User size={22} />}
              label="Profilo"
            />
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <section className="flex-1 p-10">

        <div className="grid grid-cols-[420px_1fr] gap-8">

          {/* Player Card */}
          <div className="rounded-[2.5rem] border border-white/10 bg-[#081226] p-6 shadow-2xl">

            <div className="relative overflow-hidden rounded-[2rem] border border-orange-400/40 bg-gradient-to-br from-[#0a1227] via-[#0b1730] to-[#09101d] p-6 shadow-[0_0_50px_rgba(249,115,22,.25)]">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,.35),transparent_45%)]" />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[68px] font-black leading-none text-yellow-300">
                    83
                  </div>

                  <div className="mt-1 text-xl font-black tracking-[.18em] text-yellow-200">
                    RIV
                  </div>
                </div>

                <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-black text-cyan-300">
                  CALCETTO
                </div>
              </div>

              <div className="relative mt-6 flex justify-center">
                <img
                  src="https://i.pravatar.cc/300"
                  alt="player"
                  className="h-[170px] w-[170px] rounded-3xl object-cover border-4 border-white/10"
                />
              </div>

              <div className="relative mt-7 text-center">
                <div className="text-[42px] font-black text-yellow-300">
                  SAMUELE
                </div>

                <div className="text-xl font-black tracking-[.15em] text-yellow-100">
                  SAMPON
                </div>

                <div className="mt-3 text-yellow-300 text-2xl">
                  ★
                </div>
              </div>

              <div className="relative mt-8 grid grid-cols-4 gap-3 text-center">
                <Stat value="79" label="PAC" />
                <Stat value="81" label="PAS" />
                <Stat value="84" label="DRI" />
                <Stat value="77" label="PHY" />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">

            <div className="rounded-[2rem] border border-white/10 bg-[#081226] p-8">
              <h1 className="text-[46px] font-black leading-none">
                Bentornato
              </h1>

              <div className="mt-4 text-[70px] font-black bg-gradient-to-r from-cyan-300 to-fuchsia-500 bg-clip-text text-transparent">
                SAMUELE
              </div>

              <p className="mt-4 max-w-[650px] text-lg leading-8 text-slate-300">
                Continua a giocare, salire di livello e dominare la classifica Rivalo.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-5">

              <QuickCard
                title="Partite"
                value="84"
                color="from-cyan-400 to-blue-600"
              />

              <QuickCard
                title="Vittorie"
                value="52"
                color="from-lime-300 to-green-500"
              />

              <QuickCard
                title="RivalScore"
                value="83"
                color="from-fuchsia-500 to-pink-500"
              />

            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#081226] p-8">
              <div className="text-3xl font-black">
                Azioni rapide
              </div>

              <div className="mt-7 grid grid-cols-2 gap-5">

                <ActionButton label="Crea Match" />
                <ActionButton label="Nuovo Gruppo" />
                <ActionButton label="Community" />
                <ActionButton label="Eventi" />

              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-lg font-bold transition ${
        active
          ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(34,211,238,.25)]"
          : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="text-2xl font-black text-yellow-300">
        {value}
      </div>

      <div className="text-sm font-bold text-slate-300">
        {label}
      </div>
    </div>
  );
}

function QuickCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#081226] p-6">
      <div className="text-slate-400 font-semibold">
        {title}
      </div>

      <div
        className={`mt-4 bg-gradient-to-r ${color} bg-clip-text text-[58px] font-black text-transparent`}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  label,
}: {
  label: string;
}) {
  return (
    <button className="rounded-2xl border border-white/10 bg-white/[.04] px-6 py-5 text-lg font-black transition hover:border-cyan-400/40 hover:bg-cyan-400/10">
      {label}
    </button>
  );
}
