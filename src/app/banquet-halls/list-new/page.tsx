"use client";
import { useState } from "react";
import { Stepper, Step, StepLabel, Button, Typography, CircularProgress } from "@mui/material";
import { BasicInfoStep } from "@/components/banquet-halls/list-new/BasicInfoStep";
import { DescriptionStep } from "@/components/banquet-halls/list-new/DescriptionStep";
import { EquipmentStep } from "@/components/banquet-halls/list-new/EquipmentStep";
import { MultimediaStep } from "@/components/banquet-halls/list-new/MultimediaStep";
import { ConfirmationStep } from "@/components/banquet-halls/list-new/ConfirmationStep";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const steps = [
  "Basic Information",
  "Detailed Description",
  "Equipment and Amenities",
  "Multimedia Upload",
  "Confirmation",
];

export default function ListNewBanquetHall() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const fd = formData || {};
      const hallName = fd.name || fd.title || 'قاعة حفلات ومناسبات';
      const cleanSlug = hallName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'hall';

      const { error } = await supabase.from('stores').insert({
        owner_id: user?.id || null,
        name: hallName,
        slug: `${cleanSlug}-${Date.now().toString().slice(-4)}`,
        type: 'banquet_hall',
        category: 'Banquet Halls',
        description: fd.description || 'قاعة حفلات ومؤتمرات راقية ومجهزة بالكامل.',
        phone: fd.phone || fd.contactPhone || '',
        email: fd.email || user?.email || '',
        city: fd.city || 'الجزائر العاصمة',
        wilaya_code: fd.wilayaCode || fd.wilaya || '16',
        full_address: fd.address || fd.location || '',
        banner_image_url: fd.bannerUrl || fd.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
        supports_appointments: true,
        services_offered: Array.isArray(fd.equipment) ? fd.equipment : ['sound_system', 'stage', 'catering', 'air_conditioning'],
        popularity: 15,
        average_rating: 5.0,
      });

      if (error) throw error;
      setActiveStep(steps.length);
    } catch (err: any) {
      console.error('Error saving banquet hall to database:', err);
      setSubmitError(err.message || 'حدث خطأ أثناء حفظ بيانات القاعة.');
    } finally {
      setIsSubmitting(false);
    }
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
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
                {submitError}
              </div>
            )}
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