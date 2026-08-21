"use client";
import { useState, useEffect } from "react";
import { HallCard } from "@/components/banquet-halls/HallCard";
import { CircularProgress, Typography } from "@mui/material";

// Mock data for initial display
const mockHalls = [
  {
    id: "1",
    hallName: "The Grand Hall",
    location: "Sidi Bel Abbès",
    capacity: 200,
    price: 500,
    imageUrl: "/placeholder-image.jpg",
  },
  {
    id: "2",
    hallName: "The Crystal Ballroom",
    location: "Sidi Bel Abbès",
    capacity: 300,
    price: 800,
    imageUrl: "/placeholder-image.jpg",
  },
  {
    id: "3",
    hallName: "The Emerald Room",
    location: "Sidi Bel Abbès",
    capacity: 150,
    price: 400,
    imageUrl: "/placeholder-image.jpg",
  },
];

export default function BanquetHallsPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setHalls(mockHalls);
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h4" gutterBottom>
        Available Banquet Halls
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <div key={hall.id}>
            <HallCard hall={hall} />
          </div>
        ))}
      </div>
    </div>
  );
}