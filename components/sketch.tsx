import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
};

/** Карандашный скетч на бумаге: multiply убирает фон листа, остаётся графит. */
export function Sketch({ src, alt, width, height, className = "", sizes = "(min-width: 768px) 45vw, 80vw" }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={`pointer-events-none select-none mix-blend-multiply opacity-90 h-auto ${className}`}
    />
  );
}
