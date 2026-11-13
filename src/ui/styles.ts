/**
 * Global styles for every page: the fonts, the tokens and the base styles.
 * Import once, from each entry point, before anything else renders.
 *
 * Fonts are self-hosted through @fontsource (ADR 0001, section 8). Each
 * weight's CSS covers every subset with a unicode-range, so a browser only
 * downloads the subsets a page uses. Only the weights on the token sheet are
 * loaded.
 */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './tokens.css';
import './base.css';
