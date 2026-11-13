import type { ReactNode } from 'react';
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components';
import { IconButton } from './Button.tsx';
import { CloseIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './Sheet.module.css';

export interface SheetProps extends Omit<ModalOverlayProps, 'className' | 'style' | 'children'> {
  /** The heading, which also names the dialog. */
  title: string;
  /** A line under the heading, such as "Applies to both Pokémon". */
  subtitle?: string;
  /** The footer, usually the primary action ("Done"). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * A modal sheet: slides up from the bottom on a phone, and is a centred
 * dialog on a wider screen. Put it inside a DialogTrigger after the button
 * that opens it, or control it with isOpen / onOpenChange.
 *
 * Focus moves into the sheet and returns to the trigger when it closes;
 * Escape, the close button and a tap on the scrim all close it. With
 * reduced motion on it appears without sliding.
 */
export function Sheet({ title, subtitle, footer, children, isDismissable = true, ...props }: SheetProps) {
  return (
    <ModalOverlay {...props} isDismissable={isDismissable} className={classes(styles.overlay)}>
      <Modal className={classes(styles.modal)}>
        <Dialog className={classes(styles.dialog)}>
          {({ close }) => (
            <>
              <div aria-hidden="true" className={classes(styles.grabber)} />
              <div className={classes(styles.header)}>
                <div className={classes(styles.titles)}>
                  <Heading slot="title" className={classes(styles.title)}>
                    {title}
                  </Heading>
                  {subtitle ? <p className={classes(styles.subtitle)}>{subtitle}</p> : null}
                </div>
                <IconButton aria-label="Close" onPress={close}>
                  <CloseIcon />
                </IconButton>
              </div>
              <div className={classes(styles.body)}>{children}</div>
              {footer ? <div className={classes(styles.footer)}>{footer}</div> : null}
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

export interface SheetSectionProps {
  /** A small label above a group of rows, such as "Weather". */
  label: string;
  children: ReactNode;
}

/** A labelled group of rows inside a sheet. */
export function SheetSection({ label, children }: SheetSectionProps) {
  return (
    <div role="group" aria-label={label} className={classes(styles.section)}>
      <span aria-hidden="true" className={classes(styles.sectionLabel)}>
        {label}
      </span>
      {children}
    </div>
  );
}

/** Small print at the bottom of a sheet, above a hairline. */
export function SheetNote({ children }: { children: ReactNode }) {
  return <p className={classes(styles.note)}>{children}</p>;
}
