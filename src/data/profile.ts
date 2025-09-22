import rawProfile from './profile.json';

type Statement = string[];

type Profile = {
  name: string;
  tagline: string;
  statement: Statement;
  bio: string[];
  contact: {
    email: string;
    phone: string;
    instagram: string;
    location: string;
  };
  education: {
    year: string;
    program: string;
  }[];
  awards: {
    year: string;
    title: string;
    notes?: string;
  }[];
};

export const profile: Profile = rawProfile as Profile;
