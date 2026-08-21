"use client";
import { useState } from "react";
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";

const equipmentOptions = [
  "Sound System",
  "Projector",
  "Stage",
  "Dance Floor",
  "Kitchen Facilities",
  "Air Conditioning",
  "Heating",
  "Wi-Fi",
  "Parking",
];

export const EquipmentStep = ({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) => {
  const [equipment, setEquipment] = useState<string[]>([]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    if (checked) {
      setEquipment((prev) => [...prev, name]);
    } else {
      setEquipment((prev) => prev.filter((item) => item !== name));
    }
  };

  const handleNext = () => {
    onNext({ equipment });
  };

  return (
    <div className="space-y-4">
      <div>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            Select Available Equipment and Amenities
          </FormLabel>
          <FormGroup>
            {equipmentOptions.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={equipment.includes(option)}
                    onChange={handleCheckboxChange}
                    name={option}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        </FormControl>
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