import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  onClick?: () => void;
  isClickable?: boolean;
}

function StatsCard({ title, value, icon, description, onClick, isClickable }: StatsCardProps) {
  return (
    <Card 
      className={`
        bg-card text-card-foreground border-border
        transition-all duration-200
        ${isClickable 
          ? "cursor-pointer hover:bg-accent hover:border-accent-foreground/20 active:scale-[0.98]" 
          : ""
        }
      `}
      onClick={onClick}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Clean SVG icons with proper dark mode support
const BookingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SoftReservationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ConfirmedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const UpcomingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const RevenueIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ConversionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-foreground"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

interface SalesStatsCardsProps {
  totalBookings: number;
  softReservations: number;
  confirmedBookings: number;
  upcomingEvents: number;
  monthlyRevenue?: number;
  conversionRate?: number;
  onFilterChange?: (filter: string) => void;
}

export function SalesStatsCards({
  totalBookings,
  softReservations,
  confirmedBookings,
  upcomingEvents,
  monthlyRevenue,
  conversionRate,
  onFilterChange,
}: SalesStatsCardsProps) {
  const [, setLocation] = useLocation();

  const handleCardClick = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  const cards = [
    {
      title: "Total",
      value: totalBookings,
      icon: <BookingIcon />,
      description: "All bookings",
      onClick: () => handleCardClick("all"),
    },
    {
      title: "Soft",
      value: softReservations,
      icon: <SoftReservationIcon />,
      description: "Pending",
      onClick: () => handleCardClick("soft_reservation"),
    },
    {
      title: "Confirmed",
      value: confirmedBookings,
      icon: <ConfirmedIcon />,
      description: "Ready",
      onClick: () => handleCardClick("confirmed"),
    },
    {
      title: "Upcoming",
      value: upcomingEvents,
      icon: <UpcomingIcon />,
      description: "30 days",
      onClick: () => handleCardClick("upcoming"),
    },
    ...(monthlyRevenue !== undefined ? [{
      title: "Revenue",
      value: `${(monthlyRevenue / 1000000).toFixed(1)}M`,
      icon: <RevenueIcon />,
      description: "This month",
      onClick: () => setLocation("/sales/reports"),
    }] : []),
    ...(conversionRate !== undefined ? [{
      title: "Rate",
      value: `${conversionRate.toFixed(0)}%`,
      icon: <ConversionIcon />,
      description: "Conversion",
      onClick: () => setLocation("/sales/reports"),
    }] : []),
  ];

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scrollable - compact cards */}
      <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {cards.map((card, index) => (
          <div key={index} className="snap-center flex-shrink-0 w-[120px]">
            <StatsCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.description}
              onClick={card.onClick}
              isClickable
            />
          </div>
        ))}
      </div>

      {/* Tablet: 3 columns */}
      <div className="hidden sm:grid md:hidden grid-cols-3 gap-3">
        {cards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
            onClick={card.onClick}
            isClickable
          />
        ))}
      </div>

      {/* Desktop: 6 columns */}
      <div className="hidden md:grid grid-cols-6 gap-3">
        {cards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
            onClick={card.onClick}
            isClickable
          />
        ))}
      </div>

      {/* Mobile scroll hint */}
      <p className="sm:hidden text-center text-[10px] text-muted-foreground mt-1">
        ← Swipe →
      </p>
    </div>
  );
}
