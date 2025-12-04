import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function ReportFilters({ series, onFilterChange, filters }) {
  const [dateRange, setDateRange] = useState(filters.dateRange || { from: null, to: null });
  const [selectedSeries, setSelectedSeries] = useState(filters.series || "all");

  const applyFilters = () => {
    onFilterChange({ dateRange, series: selectedSeries });
  };

  const clearFilters = () => {
    setDateRange({ from: null, to: null });
    setSelectedSeries("all");
    onFilterChange({ dateRange: { from: null, to: null }, series: "all" });
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    let from, to;
    switch (preset) {
      case "7d":
        from = subDays(today, 7);
        to = today;
        break;
      case "30d":
        from = subDays(today, 30);
        to = today;
        break;
      case "month":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      default:
        from = null;
        to = null;
    }
    setDateRange({ from, to });
  };

  const hasActiveFilters = dateRange.from || dateRange.to || selectedSeries !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border shadow-sm mb-6">
      <Filter className="w-4 h-4 text-slate-500" />
      
      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {dateRange.from ? (
              dateRange.to ? (
                `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
              ) : format(dateRange.from, "MMM d, yyyy")
            ) : "Select dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPresetRange("7d")}>Last 7 days</Button>
            <Button size="sm" variant="ghost" onClick={() => setPresetRange("30d")}>Last 30 days</Button>
            <Button size="sm" variant="ghost" onClick={() => setPresetRange("month")}>This month</Button>
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => setDateRange(range || { from: null, to: null })}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Series Filter */}
      <Select value={selectedSeries} onValueChange={setSelectedSeries}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Series" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Series</SelectItem>
          {series.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" onClick={applyFilters}>Apply</Button>
      
      {hasActiveFilters && (
        <Button size="sm" variant="ghost" onClick={clearFilters} className="text-slate-500">
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}