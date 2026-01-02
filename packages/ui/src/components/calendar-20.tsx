// components/calendar-20.tsx
"use client";

import * as React from "react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ChevronDownIcon } from "lucide-react";

interface Calendar20Props {
  placeholder?: string;
  value?: { date?: string | null; time?: string | null };
  onChange?: (value: { date?: string | null; time?: string | null }) => void;
  isReturnDate?: boolean; // Add this prop to distinguish between departure and return
}

export function Calendar20({
  placeholder = "Select date & time",
  value,
  onChange,
  isReturnDate = false, // Default to false for departure dates
}: Calendar20Props) {
  const [open, setOpen] = React.useState(false);

  // Convert string date to Date object for the calendar - FIXED TIMEZONE ISSUE
  const date = React.useMemo(() => {
    if (!value?.date) return undefined;

    try {
      // Create date in local timezone to avoid timezone shift issues
      const [year, month, day] = value.date.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);

      // Validate the date
      if (isNaN(localDate.getTime())) {
        console.warn("Invalid date:", value.date);
        return undefined;
      }

      return localDate;
    } catch (error) {
      console.error("Error parsing date:", error);
      return undefined;
    }
  }, [value?.date]);

  const selectedTime = value?.time || null;

  // Generate 30-minute time slots from 00:00 to 23:30 (24-hour format)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const totalMinutes = i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  });

  // Different display logic for return dates (no time)
  const displayValue = isReturnDate
    ? date
      ? date.toLocaleDateString()
      : placeholder
    : date && selectedTime
      ? `${date.toLocaleDateString()} • ${selectedTime}`
      : date
        ? `${date.toLocaleDateString()} • Select time`
        : placeholder;

  // Define today and extend to December 2026
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day

  const maxDate = new Date();
  maxDate.setFullYear(2026, 11, 31); // December 31, 2026
  maxDate.setHours(23, 59, 59, 999);

  // Handle date selection - FIXED DATE FORMATTING
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format as YYYY-MM-DD without timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      if (isReturnDate) {
        // For return dates, only send date, no time
        onChange?.({
          date: dateString,
          time: null,
        });
        setOpen(false); // Close immediately for return dates
      } else {
        // For departure dates, keep existing time if any
        onChange?.({
          date: dateString,
          time: selectedTime || undefined,
        });
      }
    } else {
      onChange?.({ date: null, time: null });
    }
  };

  // Handle time selection (only for departure dates)
  const handleTimeSelect = (time: string) => {
    if (isReturnDate) return; // Return dates don't have time selection

    const dateString = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(date.getDate()).padStart(2, "0")}`
      : undefined;

    onChange?.({
      date: dateString,
      time,
    });

    // Close popover if we have both date and time
    if (date) {
      setOpen(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    onChange?.({ date: null, time: null });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal text-left"
        >
          <span
            className={!date && !selectedTime ? "text-muted-foreground" : ""}
          >
            {displayValue}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-[#D4AF37]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto max-w-[95vw]"
        align="start"
        sideOffset={8}
      >
        <div className={`flex ${isReturnDate ? "flex-col" : "flex-row"}`}>
          {/* Calendar */}
          <div className={`p-2 sm:p-3 ${isReturnDate ? "" : "border-r"}`}>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromDate={today}
              toDate={maxDate}
              fromYear={today.getFullYear()}
              toYear={2026}
              className="text-xs sm:text-sm"
            />

            {/* Clear button */}
            {(date || (!isReturnDate && selectedTime)) && (
              <div className="p-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 text-xs sm:text-sm"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Time Slots - Only show for departure dates */}
          {!isReturnDate && (
            <div className="max-h-72 sm:max-h-80 overflow-y-auto p-2 sm:p-3 w-24 sm:w-32">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "gold" : "outline"}
                  onClick={() => handleTimeSelect(time)}
                  className="w-full mb-1 sm:mb-2 text-xs sm:text-sm py-1 sm:py-2"
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
