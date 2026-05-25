"use client";

type PlayerStat = {
  uid?: string;
  name: string;
  team: "home" | "away";
  goals: number;
  assists: number;
  isMvp: boolean;
};

export default function PlayerStatsEditor({
  players,
  setPlayers,
  participants,
}: {
  players: PlayerStat[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerStat[]>>;
  participants: any[];
}) {
  function updatePlayer(index: number, field: keyof PlayerStat, value: any) {
    setPlayers((current) =>
      current.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    );
  }

  function addPlayer() {
    setPlayers([
      ...players,
      {
        uid: "",
        name: "",
        team: "home",
        goals: 0,
        assists: 0,
        isMvp: false,
      },
    ]);
  }

  function removePlayer(index: number) {
    setPlayers(players.filter((_, i) => i !== index));
  }

  const selectedUids = players.map((p) => p.uid).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black text-white">
          Statistiche giocatori
        </h3>

        <button
          type="button"
          onClick={addPlayer}
          className="rounded-2xl bg-cyan-400/10 px-4 py-2 font-black text-cyan-300"
        >
          + Giocatore
        </button>
      </div>

      {(players || []).map((player, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-white/10 bg-[#071126] p-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-black uppercase text-slate-400">
                Giocatore
              </div>

              <select
                value={player.uid || ""}
                onChange={(e) => {
                  const selectedUid = e.target.value;

                  const alreadySelected = players.some(
                    (p, i) => i !== index && p.uid === selectedUid
                  );

                  if (alreadySelected) {
                    alert("Giocatore già inserito.");
                    return;
                  }

                  const selectedPlayer = (participants || []).find(
                    (p: any) => String(p.uid || p.id) === String(selectedUid)
                  );

                  setPlayers((current) =>
                    current.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            uid: selectedUid,
                            name:
                              selectedPlayer?.name ||
                              selectedPlayer?.nickname ||
                              "Giocatore",
                            team: item.team || "home",
                          }
                        : item
                    )
                  );
                }}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base font-black text-white outline-none"
              >
                <option value="">Seleziona giocatore</option>

                {(participants || [])
                  .filter((p: any) => p.name || p.nickname)
                  .map((p: any, i: number) => {
                    const userId = String(p.uid || p.id || "");
                    const isSelected =
                      selectedUids.includes(userId) && player.uid !== userId;

                    return (
                      <option
                        key={userId || i}
                        value={userId}
                        disabled={isSelected}
                      >
                        {p.name || p.nickname}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div>
              <div className="mb-2 text-xs font-black uppercase text-slate-400">
                Squadra
              </div>

              <select
                value={player.team || "home"}
                onChange={(e) =>
                  updatePlayer(index, "team", e.target.value as "home" | "away")
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base font-black text-white outline-none"
              >
                <option value="home">Squadra 1</option>
                <option value="away">Squadra 2</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-2 text-xs font-black uppercase text-slate-400">
                Gol
              </div>

              <input
                type="number"
                min="0"
                value={player.goals ?? 0}
                onChange={(e) =>
                  updatePlayer(index, "goals", Number(e.target.value || 0))
                }
                className="w-full min-w-[90px] rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-2xl font-black text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-black uppercase text-slate-400">
                Assist
              </div>

              <input
                type="number"
                min="0"
                value={player.assists ?? 0}
                onChange={(e) =>
                  updatePlayer(index, "assists", Number(e.target.value || 0))
                }
                className="w-full min-w-[90px] rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-2xl font-black text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-black uppercase text-slate-400">
                MVP
              </div>

              <label className="flex h-[60px] items-center justify-center gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 font-black text-yellow-300">
                <input
                  type="checkbox"
                  checked={player.isMvp}
                  onChange={(e) =>
                    updatePlayer(index, "isMvp", e.target.checked)
                  }
                />
                MVP
              </label>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200">
            {(player.name || "Giocatore")} •{" "}
            {player.team === "home" ? "Squadra 1" : "Squadra 2"}
          </div>

          <button
            type="button"
            onClick={() => removePlayer(index)}
            className="mt-5 text-sm font-black text-red-400"
          >
            Rimuovi giocatore
          </button>
        </div>
      ))}
    </div>
  );
}