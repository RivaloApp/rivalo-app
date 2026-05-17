import CommonCard from "./cards/CommonCard";
import RareCard from "./cards/RareCard";
import EliteCard from "./cards/EliteCard";
import LegendCard from "./cards/LegendCard";

type PlayerCardProps = {
  name: string;
  role: string;
  score: number;
  badge: string;
};

export function PlayerCard({ name, role, score, badge }: PlayerCardProps) {
  const cardProps = {
    name,
    role,
    score,
    badge,
  };

  if (score >= 95) return <LegendCard {...cardProps} />;
  if (score >= 88) return <EliteCard {...cardProps} />;
  return <RareCard {...cardProps} />;

  return <CommonCard {...cardProps} />;
}