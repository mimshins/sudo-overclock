"use client";

/*
 * CoverImage — local book-cover thumbnail. Renders nothing on load error so
 * the styled fallback (initials) behind it shows instead of a broken icon.
 */

import { useCallback, useState } from "react";

type CoverImageProps = {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
};

const CoverImage = ({ src, alt, className }: CoverImageProps) => {
  const [hidden, setHidden] = useState(false);

  const handleError = useCallback((): void => {
    setHidden(true);
  }, []);

  if (hidden) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={handleError}
    />
  );
};

export type { CoverImageProps };
export { CoverImage };
