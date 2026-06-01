// Here Be Dragons DS — ds/index.js
// ESM barrel: imports + registers all Custom Elements (CLAUDE.md §7.5)

// Warm the shared-stylesheet cache before any component upgrades so adopted
// stylesheets are synchronously available from cache and there is no FOUC
// "blink" on first render. See ds/utils/shared-styles.js for details.
import { preloadStyles } from './utils/shared-styles.js';
preloadStyles([
  '/tokens/tokens.css',
  '/ds/styles/foundations/accessibility.css',
  '/ds/styles/components/button.css',
  '/ds/styles/components/callout.css',
  '/ds/styles/components/checkbox.css',
  '/ds/styles/components/codeblock.css',
  '/ds/styles/components/date-picker.css',
  '/ds/styles/components/file-upload.css',
  '/ds/styles/components/form-validation.css',
  '/ds/styles/components/input.css',
  '/ds/styles/components/tabs.css',
  '/ds/styles/components/time-picker.css',
]);

import './components/hbd-breadcrumbs.js';
import './components/hbd-button.js';
import './components/hbd-callout.js';
import './components/hbd-checkbox.js';
import './components/hbd-codeblock.js';
import './components/hbd-combobox.js';
import './components/hbd-date-picker.js';
import './components/hbd-divider.js';
import './components/hbd-file-upload.js';
import './components/hbd-input.js';
import './components/hbd-otp-input.js';
import './components/hbd-radio-group.js';
import './components/hbd-select.js';
import './components/hbd-slider.js';
import './components/hbd-spell-card.js';
import './components/hbd-split-button.js';
import './components/hbd-stat-block.js';
import './components/hbd-stepper.js';
import './components/hbd-switch.js';
import './components/hbd-tabs.js';
import './components/hbd-textarea.js';
import './components/hbd-time-picker.js';
import './components/hbd-toggle-group.js';
