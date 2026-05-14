import { ReactNode } from "react";

type SportCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function SportCard({ icon, title, description }: SportCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.07]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 text-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
