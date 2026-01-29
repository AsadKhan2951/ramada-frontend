import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from "date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Booking {
  id: number;
  clientName: string;
  eventDate: Date;
  status: string;
  totalAmount: string;
  paidAmount: string | null;
  createdAt: Date;
  banquetHallId: number | null;
}

interface SalesChartsProps {
  bookings: Booking[];
}

export function SalesCharts({ bookings }: SalesChartsProps) {
  // Calculate monthly booking data for the last 6 months
  const monthlyData = useMemo(() => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(today, 5),
      end: today,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthBookings = bookings.filter((b) => {
        const createdAt = new Date(b.createdAt);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      });

      const confirmed = monthBookings.filter((b) => b.status === "confirmed").length;
      const soft = monthBookings.filter(
        (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
      ).length;
      const revenue = monthBookings.reduce(
        (sum, b) => sum + parseFloat(b.totalAmount || "0"),
        0
      );

      return {
        month: format(month, "MMM yyyy"),
        shortMonth: format(month, "MMM"),
        total: monthBookings.length,
        confirmed,
        soft,
        revenue,
      };
    });
  }, [bookings]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const soft = bookings.filter(
      (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
    ).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    return { confirmed, soft, completed, cancelled };
  }, [bookings]);

  // Bookings Trend Chart
  const bookingsTrendData = {
    labels: monthlyData.map((d) => d.shortMonth),
    datasets: [
      {
        label: "Total Bookings",
        data: monthlyData.map((d) => d.total),
        borderColor: "#1f2937",
        backgroundColor: "rgba(31, 41, 55, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Confirmed",
        data: monthlyData.map((d) => d.confirmed),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const bookingsTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Revenue Chart
  const revenueData = {
    labels: monthlyData.map((d) => d.shortMonth),
    datasets: [
      {
        label: "Revenue (PKR)",
        data: monthlyData.map((d) => d.revenue / 1000000),
        backgroundColor: "#1f2937",
        borderRadius: 8,
      },
    ],
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `PKR ${context.raw.toFixed(2)}M`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value: any) => `${value}M`,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Status Distribution Chart
  const statusData = {
    labels: ["Confirmed", "Soft Reservation", "Completed", "Cancelled"],
    datasets: [
      {
        data: [
          statusDistribution.confirmed,
          statusDistribution.soft,
          statusDistribution.completed,
          statusDistribution.cancelled,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#6b7280", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    cutout: "60%",
  };

  // Conversion Rate Chart
  const conversionData = useMemo(() => {
    return monthlyData.map((d) => {
      const total = d.confirmed + d.soft;
      return total > 0 ? ((d.confirmed / total) * 100).toFixed(0) : 0;
    });
  }, [monthlyData]);

  const conversionChartData = {
    labels: monthlyData.map((d) => d.shortMonth),
    datasets: [
      {
        label: "Conversion Rate %",
        data: conversionData,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const conversionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bookings Trend */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Bookings Trend
          </CardTitle>
          <p className="text-sm text-gray-500">Last 6 months performance</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={bookingsTrendData} options={bookingsTrendOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Monthly Revenue
          </CardTitle>
          <p className="text-sm text-gray-500">Revenue in millions (PKR)</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={revenueData} options={revenueOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Booking Status
          </CardTitle>
          <p className="text-sm text-gray-500">Distribution by status</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={statusData} options={statusOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Conversion Rate
          </CardTitle>
          <p className="text-sm text-gray-500">Soft to confirmed ratio</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={conversionChartData} options={conversionOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
