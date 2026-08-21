"use client";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
} from "@mui/material";
import Link from "next/link";

export const HallCard = ({ hall }: { hall: any }) => {
  return (
    <Card>
      <CardMedia
        component="img"
        height="140"
        image={hall.imageUrl}
        alt={hall.hallName}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {hall.hallName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hall.location}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={`/halls/${hall.id}`} passHref>
          <Button size="small" color="primary">
            View Details
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};