"use client";
import { Button, Typography, Paper } from "@mui/material";

export const ConfirmationStep = ({ formData, onBack, onSubmit }: { formData: any; onBack: () => void; onSubmit: () => void }) => {
  return (
    <Paper elevation={3} className="p-4">
      <Typography variant="h6" gutterBottom>
        Confirm Your Details
      </Typography>
      <div className="space-y-4">
        <div>
          <Typography variant="subtitle1">
            <strong>Hall Name:</strong> {formData.hallName}
          </Typography>
        </div>
        <div>
          <Typography variant="subtitle1">
            <strong>Location:</strong> {formData.location}
          </Typography>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Typography variant="subtitle1">
              <strong>Capacity:</strong> {formData.capacity}
            </Typography>
          </div>
          <div>
            <Typography variant="subtitle1">
              <strong>Price per Day:</strong> ${formData.price}
            </Typography>
          </div>
        </div>
        <div>
          <Typography variant="subtitle1">
            <strong>Description:</strong> {formData.description}
          </Typography>
        </div>
        <div>
          <Typography variant="subtitle1">
            <strong>Equipment:</strong> {formData.equipment?.join(", ")}
          </Typography>
        </div>
        <div>
          <Typography variant="subtitle1">
            <strong>Photos:</strong> {formData.photos?.map((p: any) => p.name).join(", ")}
          </Typography>
        </div>
        <div>
          <Typography variant="subtitle1">
            <strong>360 View URL:</strong> {formData.panoUrl}
          </Typography>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <Button className="w-1/2" variant="contained" onClick={onBack}>
          Back
        </Button>
        <Button className="w-1/2" variant="contained" color="primary" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </Paper>
  );
};