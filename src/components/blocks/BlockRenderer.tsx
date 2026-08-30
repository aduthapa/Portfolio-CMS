import type {
  ButtonContent,
  GalleryContent,
  HeadingContent,
  ImageContent,
  PageBlockWithEmbed,
  TextContent,
  VideoContent,
} from "../../lib/blocks";
import { ButtonLink } from "../ui/Button";

// One component per BlockType, dispatched below — mirrors
// views/public/blocks/*.ejs's include('blocks/' + block.type.toLowerCase())
// pattern from the old app.

function HeadingBlock({ content }: { content: HeadingContent }) {
  const level = (["h1", "h2", "h3"] as const).includes(content.level) ? content.level : "h2";
  const Tag = level;
  const sizeClass = level === "h1" ? "text-[2.2rem]" : level === "h2" ? "text-[1.7rem]" : "text-[1.3rem]";
  return (
    <div className="container mx-auto max-w-[1120px] px-5 py-7">
      <Tag className={`m-0 tracking-tight ${sizeClass}`}>{content.text}</Tag>
    </div>
  );
}

function TextBlock({ content }: { content: TextContent }) {
  return (
    <div className="mx-auto max-w-[640px] px-5 py-7">
      <p className="m-0 whitespace-pre-line text-[1.05rem] leading-[1.75]">{content.text}</p>
    </div>
  );
}

function ImageBlock({ content }: { content: ImageContent }) {
  if (!content.url) return null;
  return (
    <div className="mx-auto max-w-[640px] px-5 py-7">
      <figure className="m-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote, admin-supplied URLs; see media upload */}
        <img src={content.url} alt={content.caption || ""} loading="lazy" className="block w-full rounded-lg" />
        {content.caption && <figcaption className="mt-2 text-center text-sm text-ink-muted">{content.caption}</figcaption>}
      </figure>
    </div>
  );
}

function GalleryBlock({ content }: { content: GalleryContent }) {
  if (!content.images?.length) return null;
  return (
    <div className="container mx-auto max-w-[1120px] px-5 py-7">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
        {content.images.map((img, i) => (
          <a
            key={i}
            href={img.url}
            target="_blank"
            rel="noopener"
            className="block aspect-square overflow-hidden rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote, admin-supplied URLs */}
            <img
              src={img.url}
              alt={img.caption || ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.06]"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function ButtonBlock({ content }: { content: ButtonContent }) {
  return (
    <div className="container mx-auto max-w-[1120px] px-5 py-7 text-center">
      <ButtonLink href={content.url} variant={content.style === "secondary" ? "ghost" : "primary"} size="lg">
        {content.label}
      </ButtonLink>
    </div>
  );
}

function VideoBlock({ content, embedUrl }: { content: VideoContent; embedUrl: string | null }) {
  if (embedUrl) {
    return (
      <div className="mx-auto max-w-[640px] px-5 py-7">
        <div className="relative overflow-hidden rounded-lg bg-black pt-[56.25%]">
          <iframe
            src={embedUrl}
            title="Video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    );
  }
  if (content.url) {
    return (
      <div className="mx-auto max-w-[640px] px-5 py-7">
        <a href={content.url} target="_blank" rel="noopener">
          Watch video →
        </a>
      </div>
    );
  }
  return null;
}

function DividerBlock() {
  return (
    <div className="container mx-auto max-w-[1120px] px-5 py-7">
      <hr className="m-0 border-0 border-t border-border" />
    </div>
  );
}

export function BlockRenderer({ block }: { block: PageBlockWithEmbed }) {
  switch (block.type) {
    case "HEADING":
      return <HeadingBlock content={block.content as HeadingContent} />;
    case "TEXT":
      return <TextBlock content={block.content as TextContent} />;
    case "IMAGE":
      return <ImageBlock content={block.content as ImageContent} />;
    case "GALLERY":
      return <GalleryBlock content={block.content as GalleryContent} />;
    case "BUTTON":
      return <ButtonBlock content={block.content as ButtonContent} />;
    case "VIDEO":
      return <VideoBlock content={block.content as VideoContent} embedUrl={block.embedUrl} />;
    case "DIVIDER":
      return <DividerBlock />;
    default:
      return null;
  }
}
