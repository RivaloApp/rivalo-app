"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sport, setSport] = useState("Calcetto");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup() {
    setError("");
    setSuccess("");

    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      setSuccess("Account creato con successo!");
    } catch (err: any) {
      console.log(err);

      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111827] border border-cyan-500/20 rounded-3xl p-8">
        <h1 className="text-4xl font-black mb-8">
          Registrazione Rivalo
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full rounded-2xl bg-black border border-white/10 p-4"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-2xl bg-black border border-white/10 p-4"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Sport principale
            </label>

            <select
              value={sport}
              onChange={(e) =>
                setSport(e.target.value)
              }
              className="w-full rounded-2xl bg-black border border-white/10 p-4"
            >
              <option>Calcetto</option>
              <option>Padel</option>
              <option>Tennis</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-2xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-2xl text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleSignup}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl p-4 transition"
          >
            CREA ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
}
