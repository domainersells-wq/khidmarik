"use client";
import { useState } from "react";
import { Button, TextField } from "@mui/material";

export const MultimediaStep = ({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [panoUrl, setPanoUrl] = useState("");

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setPhotos(Array.from(event.target.files));
    }
  };

  const handleNext = () => {
    onNext({ photos, panoUrl });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="photo-upload">
          <input
            id="photo-upload"
            type="file"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
          />
          <Button variant="contained" component="span">
            Upload Photos
          </Button>
        </label>
        {photos.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {photos.map((photo, index) => (
              <p key={index}>{photo.name}</p>
            ))}
          </div>
        )}
      </div>
      <div>
        <TextField
          label="360-Degree Panoramic View URL"
          fullWidth
          value={panoUrl}
          onChange={(e) => setPanoUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-between pt-2">
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