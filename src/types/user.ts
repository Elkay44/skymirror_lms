// Basic User interface definition
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
