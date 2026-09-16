"use client";

/*
 * PostImages — client component.
 *
 * Enhances server-rendered post images with a skeleton frame and a fade-in.
 * The body HTML is compiled at build time and injected by PostBody (a server
 * component), so this only wraps each image with presentation after mount.
 *
 * The compiler emits intrinsic `width`/`height`, so layout space is reserved
 * even before hydration and without JavaScript — this is purely progressive
 * enhancement, never a CLS dependency.
 */

import { cx } from "@repo/shared/lib/cx";
import { useEffect } from "react";

import styles from "./post-images.module.css";

const PICTURE_SELECTOR =
  '[data-slot="post-body"] picture[data-slot="post-picture"]';
const IMAGE_SELECTOR = '[data-slot="post-body"] img[data-slot="post-image"]';

const hasDimensions = (image: HTMLImageElement): boolean =>
  image.getAttribute("width") !== null && image.getAttribute("height") !== null;

type ImageTarget = {
  /** Element wrapped in the skeleton frame — the `<picture>` or a lone `<img>`. */
  readonly frameContent: HTMLElement;
  /** The rendered `<img>` whose load state drives the frame. */
  readonly image: HTMLImageElement;
};

const collectTargets = (): ImageTarget[] => {
  const pictures = Array.from(
    document.querySelectorAll<HTMLElement>(PICTURE_SELECTOR),
  );
  const loneImages = Array.from(
    document.querySelectorAll<HTMLImageElement>(IMAGE_SELECTOR),
  ).filter(image => image.closest("picture") === null);

  const fromPictures = pictures.flatMap(picture => {
    const image = picture.querySelector<HTMLImageElement>("img");

    return image === null ? [] : [{ frameContent: picture, image }];
  });

  return [
    ...fromPictures,
    ...loneImages.map(image => ({ frameContent: image, image })),
  ].filter(target => hasDimensions(target.image));
};

const enhanceImage = ({ frameContent, image }: ImageTarget): (() => void) => {
  const frame = document.createElement("span");
  const imageClass = cx(styles.image);

  frame.className = cx(styles.frame);
  frame.dataset.slot = "post-image-frame";

  frameContent.parentNode?.insertBefore(frame, frameContent);
  frame.append(frameContent);
  image.classList.add(imageClass);

  const markLoaded = (): void => {
    frame.dataset.loaded = "";
  };

  const markError = (): void => {
    frame.dataset.error = "";
  };

  if (image.complete) {
    if (image.naturalWidth > 0) {
      markLoaded();
    } else {
      markError();
    }
  } else {
    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markError, { once: true });
  }

  return () => {
    image.removeEventListener("load", markLoaded);
    image.removeEventListener("error", markError);
    image.classList.remove(imageClass);
    frame.parentNode?.insertBefore(frameContent, frame);
    frame.remove();
  };
};

const PostImages = () => {
  useEffect(() => {
    const teardowns = collectTargets().map(target => enhanceImage(target));

    return () => {
      for (const teardown of teardowns) teardown();
    };
  }, []);

  return null;
};

export { PostImages };
