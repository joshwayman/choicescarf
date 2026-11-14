import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../ui/index.ts';
import styles from './UpdateNotice.module.css';

/** How often an open tab asks whether a new version has been deployed. */
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (#85) and, when a new version has been
 * downloaded, offers it. It is never applied on its own, so nothing changes
 * mid-calculation. Updating reloads the page, and the calculation is in the
 * URL, so it comes back as it was.
 */
export function UpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, CHECK_EVERY_MS);
    },
  });

  return (
    <UpdateNoticeView
      isOpen={needRefresh}
      onUpdate={() => {
        void updateServiceWorker(true);
      }}
      onDismiss={() => {
        setNeedRefresh(false);
      }}
    />
  );
}

export interface UpdateNoticeViewProps {
  isOpen: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

/** The notice itself: a polite status line with Update and Not now. */
export function UpdateNoticeView({ isOpen, onUpdate, onDismiss }: UpdateNoticeViewProps) {
  // The live region is always there, so screen readers announce the text when it appears.
  return (
    <div role="status" className={styles.region}>
      {isOpen ? (
        <div className={styles.notice}>
          <p className={styles.text}>A new version of ChoiceScarf is ready.</p>
          <div className={styles.actions}>
            <Button variant="quiet" onPress={onDismiss}>
              Not now
            </Button>
            <Button variant="primary" onPress={onUpdate}>
              Update
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
