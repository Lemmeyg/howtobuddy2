"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, SortAsc, SortDesc } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface DocumentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  status: string;
  onStatusChange: (value: string) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
}

export function DocumentFilters({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: DocumentFiltersProps) {
  const [date, setDate] = useState<{ from?: Date; to?: Date }>(dateRange);

  const handleDateSelect = (value: { from?: Date; to?: Date }) => {
    setDate(value);
    onDateRangeChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="updated_at">Date Updated</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}
                    </>
                  ) : (
                    format(date.from, "LLL dd")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setDate({ from: undefined, to: undefined });
              onDateRangeChange({ from: undefined, to: undefined });
            }}
          >
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={status === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange("all")}
        >
          All
        </Badge>
        <Badge
          variant={status === "processing" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange("processing")}
        >
          Processing
        </Badge>
        <Badge
          variant={status === "completed" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange("completed")}
        >
          Completed
        </Badge>
        <Badge
          variant={status === "error" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange("error")}
        >
          Error
        </Badge>
      </div>
    </div>
  );
} 