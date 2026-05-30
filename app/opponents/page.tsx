"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type OpponentGroup = {
  id: string;
  name?: string;
  city?: string;
  sport?: string;
  mode?: string;
  privacy?: string;
  members?: string[];
  premiumPlan?: string;
  ownerId?: string;
};

export default function OpponentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<OpponentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [sportFilter, setSportFilter] = useState("tutti");
  const [cityFilter, setCityFilter] = useState("");
  const [message, setMessage] = useState("");
const [requestingGroupId, setRequestingGroupId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadPublicGroups();
    });

    return () => unsubscribe();
  }, []);

  async function loadPublicGroups() {
    setLoading(true);

    try {
      const publicGroupsQuery = query(
        collection(db, "groups"),
        where("privacy", "==", "pubblico")
      );

      const snap = await getDocs(publicGroupsQuery);

      const result = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<OpponentGroup, "id">),
      }));

      setGroups(result);
    } catch (error) {
      console.error(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function requestJoinGroup(group: OpponentGroup) {
  if (!user) return;

  setRequestingGroupId(group.id);
  setMessage("");

  try {
    await addDoc(collection(db, "groupJoinRequests"), {
      groupId: group.id,
      groupName: group.name || "Gruppo Rivalo",
      groupOwnerId: group.ownerId || "",
      fromUid: user.uid,
      fromName: user.displayName || "Rivalo Player",
      status: "pending",
      createdAt: serverTimestamp(),
    });

    setMessage("Richiesta inviata al gruppo.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante l'invio della richiesta.");
  } finally {
    setRequestingGroupId("");
  }
}
  const filteredGroups = useMemo(() => {
    const cleanCity = cityFilter.trim().toLowerCase();

    return groups.filter((group) => {
      const sportOk =
        sportFilter === "tutti" || group.sport === sportFilter;

      const cityOk =
        !cleanCity || (group.city || "").toLowerCase().includes(cleanCity);

      const notMine = user ? !(group.members || []).includes(user.uid) : true;

      return sportOk && cityOk && notMine;
    });
  }, [groups, sportFilter, cityFilter, user]);

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                <Search size={16} />
                Rivalo Opponents
              </div>

              <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">
                Cerca avversari
              </h1>

              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                Trova gruppi pubblici Rivalo nella tua zona per calcetto, padel
                e tennis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat value={String(groups.length)} label="Gruppi pubblici" />
              <Stat value={String(filteredGroups.length)} label="Risultati" />
              <Stat value={sportFilter} label="Filtro sport" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                <MapPin size={16} />
                Città / zona
              </div>

              <input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Es. Lecce, Milano, Roma..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Sport
              </div>

              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full bg-[#061126] text-white outline-none"
              >
                <option value="tutti" className="bg-[#020617] text-white">
                  Tutti
                </option>
                <option value="calcetto" className="bg-[#020617] text-white">
                  Calcetto
                </option>
                <option value="padel" className="bg-[#020617] text-white">
                  Padel
                </option>
                <option value="tennis" className="bg-[#020617] text-white">
                  Tennis
                </option>
              </select>
            </div>
          </div>
        </section>

        {message && (
  <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
    {message}
  </div>
)}

        <section className="mt-8">
          {loading ? (
            <EmptyBox text="Caricamento avversari..." />
          ) : filteredGroups.length === 0 ? (
            <EmptyBox text="Nessun gruppo pubblico trovato con questi filtri." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => (
                <OpponentCard
  key={group.id}
  group={group}
  onRequestJoin={requestJoinGroup}
  requesting={requestingGroupId === group.id}
/>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function OpponentCard({
  group,
  onRequestJoin,
  requesting,
}: {
  group: OpponentGroup;
  onRequestJoin: (group: OpponentGroup) => void;
  requesting: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#061126]/80 p-6 shadow-2xl transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
          {group.sport || "sport"}
        </div>

        <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-slate-300">
          {group.privacy || "pubblico"}
        </div>
      </div>

      <h2 className="text-3xl font-black">{group.name || "Gruppo Rivalo"}</h2>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <MapPin size={17} className="text-fuchsia-300" />
        {group.city || "Città non inserita"}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Mini value={String(group.members?.length || 0)} label="Membri" />
        <Mini value={group.mode || "mode"} label="Modalità" />
        <Mini value={group.premiumPlan || "free"} label="Piano" />
      </div>

      <div className="mt-5 grid gap-3">
        <Link
          href={`/groups/${group.id}`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200"
        >
          Apri gruppo
          <ChevronRight size={18} />
        </Link>
        <button
  type="button"
  onClick={() => onRequestJoin(group)}
  disabled={requesting}
  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black text-white disabled:opacity-60"
>
  {requesting ? "Invio richiesta..." : "Richiedi ingresso"}
</button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="text-2xl font-black text-cyan-300">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="truncate text-sm font-black">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.03] p-6 text-slate-400">
      {text}
    </div>
  );
}