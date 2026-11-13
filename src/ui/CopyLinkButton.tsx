import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.tsx';
import { LinkIcon } from './icons.tsx';
import styles from './CopyLinkButton.module.css';

export interface CopyLinkButtonProps {
  /** The link to copy, worked out when pressed so it is always current. */
  getUrl: () => string;
  /** Stretch to share a row with its siblings ("Swap sides"). */
  grow?: boolean;
}

type Status = 'idle' | 'copied' | 'failed';

const RESET_AFTER_MS = 2500;

/**
 * "Copy link": copies the link to the calculation. The label changes to
 * "Link copied" for a moment, and the result is announced. If the browser
 * blocks the clipboard, it says to copy the address bar instead.
 */
export function CopyLinkButton({ getUrl, grow = false }: CopyLinkButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      if (!('clipboard' in navigator)) throw new Error('No clipboard');
      await navigator.clipboard.writeText(getUrl());
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    timer.current = window.setTimeout(() => {
      setStatus('idle');
    }, RESET_AFTER_MS);
  };

  return (
    <div className={grow ? styles.grow : styles.wrap}>
      <Button
        icon={<LinkIcon size={18} />}
        grow
        onPress={() => {
          void copy();
        }}
      >
        {status === 'copied' ? 'Link copied' : 'Copy link'}
      </Button>
      <p role="status" className={status === 'failed' ? styles.failed : styles.hidden}>
        {status === 'copied' ? 'Link copied' : null}
        {status === 'failed' ? 'Couldn’t copy. Copy the address from the address bar instead.' : null}
      </p>
    </div>
  );
}
