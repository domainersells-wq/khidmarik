
import { Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function PricingAndCalendarStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [pricing, setPricing] = useState({
    perHour: "",
    perDay: "",
    // more pricing options can be added here
  });
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  const handleNext = () => {
    onNext({ pricing, availability: selectedDay });
  };

  return (
    <div>
      <Typography variant="h6" className="mb-4">
        Pricing and Availability
      </Typography>
      <div className="space-y-4">
        <TextField
          label="Price per hour"
          variant="outlined"
          fullWidth
          value={pricing.perHour}
          onChange={(e) => setPricing({ ...pricing, perHour: e.target.value })}
        />
        <TextField
          label="Price per day"
          variant="outlined"
          fullWidth
          value={pricing.perDay}
          onChange={(e) => setPricing({ ...pricing, perDay: e.target.value })}
        />
        <div>
          <Typography variant="subtitle1" className="mb-2">Select available dates</Typography>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outlined">
                {selectedDay ? selectedDay.toLocaleDateString() : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          {selectedDay && (
            <div className="mt-4">
              <Typography>Pricing for {selectedDay.toLocaleDateString()}:</Typography>
              <Typography>Per Hour: ${pricing.perHour || "N/A"}</Typography>
              <Typography>Per Day: ${pricing.perDay || "N/A"}</Typography>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <Button variant="contained" onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
