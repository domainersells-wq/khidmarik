"use client";
import { useState, useEffect } from "react";
import { HallCard } from "@/components/banquet-halls/HallCard";
import { CircularProgress, Typography } from "@mui/material";

const mockHalls = [
  {
    id: "hall-1",
    hallName: "The Grand Ballroom",
    location: "Alger Centre, Alger",
    capacity: 500,
    price: 50000,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "hall-2",
    hallName: "Crystal Gardens",
    location: "Oran",
    capacity: 300,
    price: 35000,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "3",
    hallName: "The Emerald Room",
    location: "Sidi Bel Abbès",
    capacity: 150,
    price: 25000,
    imageUrl: "/placeholder.svg",
  },
];

export function BanquetHallsClient() {
  const [halls, setHalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHalls(mockHalls);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h4" gutterBottom className="font-headline font-bold">
        Available Banquet Halls & Wedding Venues in Algeria
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <HallCard key={hall.id} {...hall} />
        ))}
      </div>
    </div>
  );
}
