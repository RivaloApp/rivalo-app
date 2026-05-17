"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, storage } from "../../lib/firebase";
import { Camera, Shield, Star, Trophy, UserRound } from "lucide-react";
import RivaloLogo from "../../components/RivaloLogo";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [photoUrl, setphotoUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || currentUser.displayName || "");
          setNickname(data.nickname || "Rival Player");
          setSport(data.mainSport || "calcetto");
          setphotoUrl(data.photoUrl || "");
        } else {
          setName(currentUser.displayName || "");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

 async function uploadPhoto(file: File) {
  if (!file) return;

  setSaving(true);
  setMessage("");

  const reader = new FileReader();

  reader.onloadend = () => {
    const newphotoUrl = reader.result as string;

    setphotoUrl(newphotoUrl);
    localStorage.setItem("rivaloProfilePhoto", newphotoUrl);

      setSaving(false);
    }
  }

  async function saveProfile() {
  setSaving(true);
  setMessage("");

  const profileData = {
    name,
    nickname,
    mainSport: sport,
    photoUrl,
  };

  localStorage.setItem("rivaloProfile", JSON.stringify(profileData));
  localStorage.setItem("rivaloProfilePhoto", photoUrl);

  setMessage("Profilo aggiornato.");
  setSaving(false);
}

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <Link href="/" className="flex items-center gap-4">
    <RivaloLogo />

  </Link>

  <Link
    href="/dashboard"
    className="inline-block rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-cyan-300 transition hover:bg-white/10"
  >
    ← Torna alla dashboard
  </Link>
</div>

        <div className="mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tight">Profilo Rivalo</h1>
          <p className="mt-3 text-slate-400">Personalizza la tua card premium.</p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#071120] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,.18),transparent_30%)]" />

            <div className="relative z-10">
              <div className="relative mx-auto h-[320px] w-[260px] overflow-hidden rounded-[2rem] border border-yellow-400/50 bg-black shadow-[0_0_40px_rgba(249,115,22,.35)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(249,115,22,.45),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,.45),transparent_35%),linear-gradient(180deg,#050816_0%,#020617_100%)]" />
                <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-orange-400 to-yellow-300" />
                <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-cyan-400 to-blue-500" />

                <div className="relative z-10 flex h-full flex-col items-center px-5 py-5">
                  <div className="self-start text-5xl font-black text-yellow-300">87</div>

                  <div className="mt-2 flex h-[130px] w-[130px] items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/20 bg-black/40">
                    {photoUrl ? (
                      <img src={photoUrl} alt="profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={70} className="text-cyan-200" />
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <div className="text-3xl font-black uppercase text-yellow-300">{name || "PLAYER"}</div>
                    <div className="text-xl font-black uppercase text-yellow-100">{nickname || "RIVAL PLAYER"}</div>
                  </div>

                  <div className="mt-auto grid w-full grid-cols-3 gap-3 text-center">
                    <CardMini value="87" label="PAC" />
                    <CardMini value="85" label="DRI" />
                    <CardMini value="84" label="PHY" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#071120] p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Nome" value={name} setValue={setName} placeholder="Antonio" />
              <Field label="Nickname" value={nickname} setValue={setNickname} placeholder="Tony10" />
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-bold uppercase text-slate-400">Sport principale</label>
              <select value={sport} onChange={(e) => setSport(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400">
                <option value="calcetto">Calcetto</option>
                <option value="padel">Padel</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="flex items-center gap-3">
                <Camera className="text-cyan-300" />
                <div>
                  <div className="font-black uppercase">Carica foto card</div>
                  <div className="text-sm text-slate-400">La dashboard si aggiorna automaticamente.</div>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                className="mt-5 block w-full rounded-2xl border border-white/10 bg-black/20 p-4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                }}
              />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatBox icon={<Shield />} label="Rival Score" value="1000" />
              <StatBox icon={<Trophy />} label="Vittorie" value="0" />
              <StatBox icon={<Star />} label="MVP" value="0" />
            </div>

            {message && <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-200">{message}</div>}

            <button onClick={saveProfile} disabled={saving} className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-black uppercase transition hover:scale-[1.02] disabled:opacity-60">
              {saving ? "Salvataggio..." : "Salva profilo"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase text-slate-400">{label}</label>
      <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400" placeholder={placeholder} />
    </div>
  );
}

function CardMini({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-yellow-300">{value}</div>
      <div className="text-xs font-bold text-white/70">{label}</div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
      <div className="mb-3 flex justify-center text-cyan-300">{icon}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm font-bold uppercase text-slate-400">{label}</div>
    </div>
  );
}
function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-fuchsia-500/20 blur-xl" />
      <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/20 bg-white text-3xl font-black italic text-[#020617] shadow-[0_0_28px_rgba(34,211,238,.22)]">
        R
      </div>
    </div>
  );
}
