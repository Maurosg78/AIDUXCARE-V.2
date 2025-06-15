export interface Therapist {
  id: string;
  name: string;
  email: string;
  specialization: string;
  availability: {
    start: string;
    end: string;
  }[];
  rating: number;
  imageUrl?: string;
} 