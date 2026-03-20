import StayDetailModal from "@/features/planner/components/StayDetailModal";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  stay: TripStayItem;
};

export default function PlannerStayDetailView({ stay }: Props) {
  return <StayDetailModal stay={stay} />;
}
