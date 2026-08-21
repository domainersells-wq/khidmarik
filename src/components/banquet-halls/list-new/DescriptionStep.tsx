"use client";
import { useState } from "react";
import { TextField, Button } from "@mui/material";

export const DescriptionStep = ({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) => {
  const [description, setDescription] = useState("");

  const handleNext = () => {
    onNext({ description });
  };

  return (
    <div className="space-y-4">
      <div>
        <TextField
          label="Detailed Description"
          multiline
          rows={6}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="contained" onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
};