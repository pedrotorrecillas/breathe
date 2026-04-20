import type { CSSProperties, ImgHTMLAttributes } from "react";

type UnoptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
};

const UnoptimizedImage = ({
  fill,
  style,
  alt,
  ...props
}: UnoptimizedImageProps) => {
  const fillStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
      }
    : {};

  // Ladle runs outside Next's image pipeline, so stories need a plain img fallback.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} {...props} style={{ ...fillStyle, ...style }} />;
};

export default UnoptimizedImage;
