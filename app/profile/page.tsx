"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ChevronRight, Image, UserRound } from "lucide-react";

type RivaloProfile = {
  name?: string;
  nickname?: string;
  email?: string;
  mainSport?: string;
  photoUrl?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RivaloProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const data = snap.data() as RivaloProfile;
        setProfile(data);
        setPhotoUrl(data.photoUrl || "");
      }
    });

    return () => unsubscribe();
  }, []);

  async function savePhotoUrl() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        photoUrl: photoUrl.trim(),
      });

      setProfile((prev) => ({
        ...prev,
        photoUrl: photoUrl.trim(),
      }));

      setMessage("Foto salvata nella tua Rivalo Card.");
    } catch {
      setMessage("Errore nel salvataggio della foto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-8">
        <Link href="/dashboard" className="text-sm font-black text-cyan-300">
          ← Torna alla dashboard
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
            <div className="relative mx-auto flex h-72 w-72 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-gradient-to-br from-cyan-400/15 to-fuchsia-500/15">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto card Rivalo" className="h-full w-full object-cover" />
              ) : (
                <UserRound size={110} className="text-cyan-300" />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <div className="text-2xl font-black">{profile?.nickname || profile?.name || "Player"}</div>
                <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">
                  Rivalo Card Photo
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7 shadow-2xl backdrop-blur">
            <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">Profilo</div>
            <h1 className="mt-3 text-5xl font-black">Personalizza la tua card.</h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Per ora inseriamo un link immagine. Più avanti attiveremo caricamento diretto foto.
              La foto apparirà nella tua Rivalo Card in dashboard.
            </p>

            <label className="mt-8 block">
              <span className="mb-2 block text-sm font-black text-slate-300">Link foto</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                <Image className="text-cyan-300" size={20} />
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            <button
              onClick={savePhotoUrl}
              disabled={saving}
              className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
            >
              {saving ? "Salvataggio..." : "Salva foto card"}
              <ChevronRight size={20} />
            </button>

            {message && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-200">
                {message}
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoBox label="Nome" value={profile?.name || "-"} />
              <InfoBox label="Nickname" value={profile?.nickname || "-"} />
              <InfoBox label="Sport" value={profile?.mainSport || "-"} />
              <InfoBox label="Email" value={profile?.email || user?.email || "-"} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#061126]/70 p-5">
      <div className="text-xs font-black uppercase tracking-[.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}
