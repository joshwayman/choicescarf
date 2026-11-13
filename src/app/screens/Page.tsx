import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Page.module.css';

const SITE = 'ChoiceScarf';

let firstPage = true;

export interface PageProps {
  /** The page heading, and the start of the document title. */
  title: string;
  /** The full document title, when it shouldn't be "<title> | ChoiceScarf". */
  documentTitle?: string;
  /** Hide the heading visually; screen readers still get it. */
  hideTitle?: boolean;
  /** Narrow, readable column for text pages. */
  prose?: boolean;
  children: ReactNode;
}

/**
 * A screen's frame: sets the document title, and after a client-side
 * navigation moves focus to the heading so screen readers announce the new
 * page. (A full page load starts at the top of the document as usual.)
 */
export function Page({ title, documentTitle, hideTitle = false, prose = false, children }: PageProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = documentTitle ?? `${title} | ${SITE}`;
    if (firstPage) {
      firstPage = false;
    } else {
      heading.current?.focus();
    }
  }, [title, documentTitle]);

  return (
    <div className={prose ? styles.prose : styles.page}>
      <h1 ref={heading} tabIndex={-1} className={hideTitle ? styles.hiddenTitle : styles.title}>
        {title}
      </h1>
      {children}
    </div>
  );
}

/** Tests render several apps in one run; this makes each start like a fresh load. */
export function resetPageFocusForTests() {
  firstPage = true;
}
