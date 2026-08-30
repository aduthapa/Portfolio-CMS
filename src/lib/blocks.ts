import "server-only";
import type { BlockType } from "@prisma/client";
import { prisma } from "./prisma";
import { getVideoEmbedUrl } from "../utils/video";

export interface HeadingContent {
  text: string;
  level: "h1" | "h2" | "h3";
}
export interface TextContent {
  text: string;
}
export interface ImageContent {
  url: string;
  caption?: string;
}
export interface GalleryContent {
  images: { url: string; caption?: string }[];
}
export interface ButtonContent {
  label: string;
  url: string;
  style: "primary" | "secondary";
}
export interface VideoContent {
  url: string;
}

export interface PageBlockWithEmbed {
  id: number;
  type: BlockType;
  content: unknown;
  sortOrder: number;
  embedUrl: string | null;
}

// Mirrors src/routes/public.routes.ts's GET / handler: only visible
// blocks, sorted, with a VIDEO block's embed URL resolved server-side so
// the renderer never has to know about YouTube/Vimeo URL formats.
export async function getVisiblePageBlocks(): Promise<PageBlockWithEmbed[]> {
  const blocks = await prisma.pageBlock.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });

  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    content: block.content,
    sortOrder: block.sortOrder,
    embedUrl:
      block.type === "VIDEO" ? getVideoEmbedUrl((block.content as unknown as VideoContent).url || "") : null,
  }));
}
