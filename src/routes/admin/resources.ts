import { prisma } from "../../config/prisma";
import { SimpleResourceConfig } from "./simpleResource";

type Model = SimpleResourceConfig["model"];

export const pressConfig: SimpleResourceConfig = {
  slug: "press",
  resourceLabel: "Press mention",
  resourcePluralLabel: "Press mentions",
  viewTitleField: "title",
  viewSubField: "publication",
  orderBy: { publishedAt: "desc" },
  model: prisma.pressMention as unknown as Model,
  fields: [
    { name: "title", label: "Headline", type: "text", required: true },
    { name: "publication", label: "Publication", type: "text", required: true },
    { name: "url", label: "Article URL", type: "url" },
    { name: "publishedAt", label: "Published date", type: "date" },
  ],
};

export const awardsConfig: SimpleResourceConfig = {
  slug: "awards",
  resourceLabel: "Award",
  resourcePluralLabel: "Awards",
  viewTitleField: "title",
  viewSubField: "organization",
  orderBy: { year: "desc" },
  model: prisma.award as unknown as Model,
  fields: [
    { name: "title", label: "Award title", type: "text", required: true },
    { name: "organization", label: "Awarding organization", type: "text" },
    { name: "year", label: "Year", type: "number", placeholder: "2024" },
  ],
};

export const eventsConfig: SimpleResourceConfig = {
  slug: "events",
  resourceLabel: "Event",
  resourcePluralLabel: "Events",
  viewTitleField: "title",
  viewSubField: "location",
  orderBy: { startDate: "asc" },
  model: prisma.event as unknown as Model,
  fields: [
    { name: "title", label: "Event title", type: "text", required: true },
    { name: "location", label: "Location", type: "text" },
    { name: "startDate", label: "Date", type: "date", required: true },
    { name: "url", label: "Ticket / info URL", type: "url" },
  ],
};

export const testimonialsConfig: SimpleResourceConfig = {
  slug: "testimonials",
  resourceLabel: "Testimonial",
  resourcePluralLabel: "Testimonials",
  viewTitleField: "authorName",
  viewSubField: "authorRole",
  orderBy: { createdAt: "desc" },
  model: prisma.testimonial as unknown as Model,
  fields: [
    { name: "authorName", label: "Author name", type: "text", required: true },
    { name: "authorRole", label: "Author role / company", type: "text" },
    { name: "quote", label: "Quote", type: "textarea", required: true },
    { name: "rating", label: "Rating (1-5)", type: "number", placeholder: "5" },
  ],
};
