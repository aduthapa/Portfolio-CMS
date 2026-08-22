import { ProfileCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<ProfileCategory, string> = {
  CELEBRITY: "Celebrity",
  INFLUENCER: "Influencer",
  MUSICIAN: "Musician",
  ACTOR: "Actor",
  MODEL: "Model",
  VISUAL_ARTIST: "Visual Artist",
  ATHLETE: "Athlete",
  CREATOR: "Content Creator",
  OTHER: "Other",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as ProfileCategory,
  label,
}));
