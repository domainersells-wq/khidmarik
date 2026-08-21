"use client";
import { useState } from "react";
import { Stepper, Step, StepLabel, Button, Typography, CircularProgress } from "@mui/material";
import { BasicInfoStep } from "@/components/banquet-halls/list-new/BasicInfoStep";
import { DescriptionStep } from "@/components/banquet-halls/list-new/DescriptionStep";
import { EquipmentStep } from "@/components/banquet-halls/list-new/EquipmentStep";
import { MultimediaStep } from "@/components/banquet-halls/list-new/MultimediaStep";
import { ConfirmationStep } from "@/components/banquet-halls/list-new/ConfirmationStep";

const steps = [
  "Basic Information",
  "Detailed Description",
  "Equipment and Amenities",
  "Multimedia Upload",
  "Confirmation",
];

export default function ListNewBanquetHall() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Here you would typically send the data to your backend
    console.log("Form Data Submitted:", formData);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
    setIsSubmitting(false);
    setActiveStep(steps.length);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <BasicInfoStep onNext={handleNext} />;
      case 1:
        return <DescriptionStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <EquipmentStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <MultimediaStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <ConfirmationStep formData={formData} onBack={handleBack} onSubmit={handleSubmit} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="mt-8">
        {activeStep === steps.length ? (
          <div className="text-center">
            <Typography variant="h5" gutterBottom>
              Thank you for listing your hall!
            </Typography>
            <Typography>
              Your listing has been submitted for review. You will be notified once it is approved.
            </Typography>
          </div>
        ) : (
          <div>
            {getStepContent(activeStep)}
            {isSubmitting && (
              <div className="flex justify-center mt-4">
                <CircularProgress />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}