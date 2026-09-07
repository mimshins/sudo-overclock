import { cx } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType, ReactNode } from "react";

import styles from "./code-block.module.css";

type CodeBlockOwnProps = {
  /**
   * Optional language label rendered as a chip in the top-right corner. Phase 2
   * will pass this from Shiki's detected language.
   */
  readonly language?: string;
  readonly filename?: string;
  readonly children: ReactNode;
};

type CodeBlockProps<T extends ElementType = "pre"> = PolymorphicProps<
  T,
  CodeBlockOwnProps
>;

const CodeBlock = <T extends ElementType = "pre">({
  as,
  language,
  filename,
  className,
  children,
  ...rest
}: CodeBlockProps<T>) => {
  const Component = as ?? "pre";

  return (
    <div
      className={cx(styles.frame, className)}
      data-slot="code-block"
    >
      {(language !== undefined || filename !== undefined) && (
        <div
          className={styles.header}
          data-slot="code-block-header"
        >
          {filename !== undefined && (
            <span
              className={styles.filename}
              data-slot="code-block-filename"
            >
              {filename}
            </span>
          )}
          {language !== undefined && (
            <span
              className={styles.language}
              data-slot="code-block-language"
            >
              {language}
            </span>
          )}
        </div>
      )}
      <Component
        className={styles.pre}
        {...rest}
      >
        {children}
      </Component>
    </div>
  );
};

export type { CodeBlockProps };
export { CodeBlock };
