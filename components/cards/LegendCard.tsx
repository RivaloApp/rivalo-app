"use client";

type CardProps = {
  name: string;
  role: string;
  score: number;
  badge: string;
};

export default function CommonCard({
  name,
  role,
  score,
  badge,
}: CardProps) {
  return (
    <div>
      Legend Card - {name} - {score}
    </div>
  );
}