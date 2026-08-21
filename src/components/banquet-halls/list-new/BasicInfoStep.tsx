"use client";
import { useState } from "react";
import { TextField, Button } from "@mui/material";

export const BasicInfoStep = ({ onNext }: { onNext: (data: any) => void }) => {
  const [hallName, setHallName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");

  const handleNext = () => {
    onNext({ hallName, location, capacity, price });
  };

  return (
    <div className="space-y-4">
      <div>
        <TextField
          label="Hall Name"
          fullWidth
          value={hallName}
          onChange={(e) => setHallName(e.target.value)}
        />
      </div>
      <div>
        <TextField
          label="Location"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <TextField
            label="Capacity"
            type="number"
            fullWidth
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div>
          <TextField
            label="Price per Day"
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
};