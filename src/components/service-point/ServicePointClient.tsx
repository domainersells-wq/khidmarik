'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Headset, Users, Wrench, CalendarDays, Info, CheckCircle } from 'lucide-react';
import { format } from "date-fns";

const servicePointServices = [
  { value: "tech_support", label: "App Technical Support", icon: Headset, description: "Get help with using the Khidmatik app, account issues, or navigating features." },
  { value: "meet_professional", label: "Meet a Professional", icon: Users, description: "Schedule a brief, facilitated introduction with a registered professional (subject to availability)." },
  { value: "appliance_dropoff", label: "Appliance Drop-off/Pickup", icon: Wrench, description: "Drop off small appliances for repair assessment or pick up completed repairs." }
];

export function ServicePointClient() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !name.trim()) {
      toast({ title: "Missing Information", description: "Please provide name, service, and date.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    toast({
      title: "Appointment Requested!",
      description: `Request for ${servicePointServices.find(s => s.value === selectedService)?.label} on ${selectedDate ? format(selectedDate, "PPP") : ''} submitted. We'll contact you to confirm.`,
      duration: 5000,
    });
    setSelectedService('');
    setSelectedDate(undefined);
    setName('');
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-12">
      <header className="text-center py-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg shadow-inner">
        <h1 className="text-4xl font-bold font-headline text-primary mb-3">Khidmatik Service Point</h1>
        <p className="text-lg text-foreground max-w-2xl mx-auto">
          Our dedicated centers across Algérie for support, in-person consultations, and convenient repair drop-offs.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <Info className="mr-3 h-6 w-6 text-primary" /> About Our Service Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground">
            <p>
              Khidmatik Service Points offer direct human assistance. Meet certified craftsmen, get onboarding assistance, or drop off devices for repair.
            </p>
            <div className="flex items-start">
              <MapPin className="h-6 w-6 mr-3 mt-1 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Central Hub</h3>
                <p>123 Rue Didouche Mourad, Alger Centre, Algérie</p>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-6 w-6 mr-3 mt-1 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Operating Hours</h3>
                <p>Samedi - Jeudi: 08:30 - 18:00; Vendredi: Fermé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <CheckCircle className="mr-3 h-6 w-6 text-primary" /> Services Offered
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicePointServices.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div key={service.value} className="flex items-start p-3 bg-muted/30 rounded-md">
                  <ServiceIcon className="h-8 w-8 mr-4 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-md">{service.label}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <CalendarDays className="mr-3 h-6 w-6 text-primary" /> Book an Appointment
          </CardTitle>
          <CardDescription>Schedule a visit. We will confirm your appointment time.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAppointmentSubmit} className="space-y-6">
            <div>
              <Label htmlFor="appointmentName">Your Name *</Label>
              <Input
                id="appointmentName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="appointmentService">Reason for Visit *</Label>
              <Select value={selectedService} onValueChange={setSelectedService} required>
                <SelectTrigger id="appointmentService">
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {servicePointServices.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointmentDate">Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="appointmentDate"
                    variant={'outline'}
                    className={`w-full justify-start text-left font-normal ${!selectedDate && 'text-muted-foreground'}`}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="appointmentNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="appointmentNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific details or preferred times (morning/afternoon)?"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
