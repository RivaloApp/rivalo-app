type FeatureCardProps = {
  title: string;
  description: string;
  tag: string;
};

export function FeatureCard({ title, description, tag }: FeatureCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
      <div className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-200">
        {tag}
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
