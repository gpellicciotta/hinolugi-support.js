# HiNoLuGi Visual Style Guide and UI Design System

This specification defines the visual design system, styling architecture, and standardized interaction patterns used across the HiNoLuGi family of web applications (such as Auth, Counters, Tasks, and Todos). It establishes a coherent look and feel, shared UI widgets, and uniform usage conventions.

---

## Visual Design Foundations

HiNoLuGi web clients are constructed with native web standards (HTML5, CSS3, ECMAScript Modules) without heavyweight UI framework dependencies. The design language emphasizes functional clarity, responsive adaptability, high information density, and tactile feedback.

### Color System & Design Tokens

Color tokens are declared in [`css/colors.css`](../../css/colors.css) and semantic theme mappings are configured in [`css/style.css`](../../css/style.css). The system supports automatic OS-driven dynamic theming via `color-scheme: light dark` and `@media (prefers-color-scheme: dark)`, as well as explicit manual overrides via `:root[data-theme="dark"]` and `:root[data-theme="light"]`.

#### Core Color Palette

| Token Name         | Hex Code  | RGB Components  | Semantic Usage                                                           |
| ------------------ | --------- | --------------- | ------------------------------------------------------------------------ |
| `--blue-hex`       | `#0e6eb8` | `14, 110, 184`  | Primary brand accent, primary buttons, active links, header background   |
| `--soft-black-hex` | `#202124` | `32, 33, 36`    | Primary body text, dark chrome, menu drawer background, contextual bar   |
| `--white-hex`      | `#ffffff` | `255, 255, 255` | Primary background, high-contrast button labels, dialog surfaces         |
| `--light-grey-hex` | `#f4f4f4` | `244, 244, 244` | Subtle container backgrounds, alternating table rows, tab backgrounds    |
| `--grey-hex`       | `#d3d3d3` | `211, 211, 211` | Neutral borders, inactive threshold state, disabled control backgrounds  |
| `--dark-grey-hex`  | `#70757a` | `112, 117, 122` | Muted secondary text, sub-list section header backgrounds, input borders |
| `--green-hex`      | `#21ba45` | `33, 186, 69`   | Success state, positive threshold achievement (under max or over min)    |
| `--red-hex`        | `#db2828` | `219, 40, 40`   | Danger state, negative threshold violation, validation error messages    |
| `--yellow-hex`     | `#fbbd08` | `251, 189, 8`   | Attention/warning highlight, undo button in contextual feedback bar      |
| `--orange-hex`     | `#f2711c` | `242, 113, 28`  | Secondary status warnings, intermediate counter thresholds               |
| `--teal-hex`       | `#00b5ad` | `0, 181, 173`   | Informational callouts and auxiliary counters                            |
| `--purple-hex`     | `#a333c8` | `163, 51, 200`  | Alternative badge tags and user role indicators                          |

#### Semantic Role & Theme Token Assignments

| Semantic Token                     | Light Theme / Default              | Dark Theme Override (`data-theme="dark"`) | Usage / Surface Target                                  |
| ---------------------------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `--app-screen-bg-color`            | `var(--light-grey-hex)` (`#f4f4f4`)| `#121316`                                 | Full-screen application background and canvas           |
| `--primary-background-color`       | `var(--white-hex)` (`#ffffff`)     | `#1e2024`                                 | Cards, dialog windows, form inputs, collection headers  |
| `--primary-text-color`             | `var(--soft-black-hex)` (`#202124`)| `#e4e6eb`                                 | Primary body copy, card titles, table cell text         |
| `--secondary-background-color`     | `var(--blue-hex)` (`#0e6eb8`)      | `#1a56db`                                 | Primary action buttons, active tab indicators, header   |
| `--secondary-text-color`           | `var(--white-hex)` (`#ffffff`)     | `#ffffff`                                 | High-contrast action button labels                      |
| `--ternary-background-color`       | `var(--soft-black-hex)` (`#202124`)| `#16181b`                                 | Global menu drawer, mobile action bar, sticky chrome    |
| `--ternary-text-color`             | `var(--white-hex)` (`#ffffff`)     | `#e4e6eb`                                 | Menu items, action icons, footer text                   |
| `--card-border-color`              | `rgba(112, 117, 122, 0.2)`         | `rgba(255, 255, 255, 0.12)`               | Card borders, list separators, subtle dividers          |
| `--card-shadow`                    | `var(--shadow-md)`                 | `0 1px 4px rgba(0, 0, 0, 0.45)`           | Card elevation and floating container shadows           |
| `--muted-text-color`               | `var(--dark-grey-hex)` (`#70757a`) | `#9ca3af`                                 | Secondary timestamps, subtitles, helper hints           |
| `--form-element-bg-color`          | `var(--white-hex)` (`#ffffff`)     | `#2b2e34`                                 | Inputs, textareas, and select element backgrounds       |
| `--form-element-border-color`      | `var(--dark-grey-hex)` (`#70757a`) | `#4b5563`                                 | Input borders in default / pristine state               |
| `--form-element-text-color`        | `var(--soft-black-hex)` (`#202124`)| `#f3f4f6`                                 | Editable input text and value entries                   |

#### Form State Borders

- Default border: `--form-element-border-color: var(--dark-grey-hex);`
- Focused border: `--form-element-focus-border-color: var(--black-hex);`
- Validated border: `--form-element-valid-color: var(--green-hex);`
- Invalidated border: `--form-element-invalid-color: var(--red-hex);`
- Contextual help: `--form-element-help-color: var(--blue-hex);`

#### Z-Index Hierarchy

Explicit stacking layers are declared in [`css/style.css`](../../css/style.css):

- `--base-z-level`: `0` (Standard content flow)
- `--header-z-level`: `10` (Tab headers, sticky elements)
- `--dialog-overlay-z-level`: `100` (Backdrop scrim for modal dialogs)
- `--dialog-z-level`: `101` (Active modal dialog window)
- `--progress-z-level`: `300` (Wait overlays and spinner panels)
- `--tooltip-z-level`: `400` (Floating hover tooltips)
- `--chrome-z-level`: `500` (Sticky top and bottom shell bars)
- `--notification-z-level`: `600` (Top alert notification banner)
- `--splash-screen-z-level`: `900` (Boot and splash screen container)

#### View Container Layout Tokens

View container widths are standardized in [`css/style.css`](../../css/style.css) using shared rem tokens:

- `--view-max-width-form`: `42rem` (Standard form and catalogue list views)
- `--view-max-width-card`: `46rem` (Card-oriented informational views such as AboutView, HelpView, AccountView)
- `--view-max-width-wide`: `68rem` (Operator consoles and wide administrative data tables)

---

### Typography & Text Hierarchy

Applications rely on system fonts optimized for legibility and cross-platform consistency.

- **Primary Sans-Serif Font**: `Roboto, Helvetica, Arial, sans-serif`
- **Monospace Font**: `Roboto Mono, Consolas, monospace` (applied to numerical inputs, JSON keys/values, and timestamps)

#### Typographic Scale

- **Page / View Titles (H1)**: `1.8rem` to `2.0rem`, font-weight `700`, soft black with optional brand blue leading icon.
- **Section Headers (H2, Legend)**: `1.1rem` to `1.25rem`, font-weight `600`. In forms, rendered as section legends.
- **Body Text**: `1rem` (`16px`), line-height `1.5`, regular weight (`400`).
- **Form Labels**: `0.95rem`, font-weight `500`, aligned above inputs.
- **Badges / Tags**: `0.75rem` (`x-small`), font-weight `500`, uppercase or capitalized with pill border radii.
- **Audit & Helper Text**: `0.85rem`, font-style `italic` or muted color (`var(--dark-grey-hex)`).

---

### Geometry, Borders & Elevation

Geometry, corner rounding, and elevation shadows are standardized in [`css/style.css`](../../css/style.css) using design tokens:

- **Border Radius Tokens**:
  - `--border-radius-sm` / `--control-border-radius`: `4px` (Inputs, textareas, selects, search boxes, and buttons)
  - `--border-radius-md` / `--card-border-radius`: `8px` (Cards, panels, modal dialogs, and catalogue list items)
  - `--border-radius-lg`: `12px` (Status badges and large rounded chips)
  - `--border-radius-pill`: `1.25em` (Metadata tags and category pill chips)
  - `--border-radius-circle`: `50%` (Circular mobile action buttons and icon avatars)
- **Elevation & Shadow Tokens**:
  - `--shadow-sm`: `0 1px 3px rgba(0, 0, 0, 0.08)` (Subtle element elevation, badges, list cards)
  - `--shadow-md` / `--card-shadow`: `0 1px 4px rgba(0, 0, 0, 0.08)` (Main card surfaces, data panels)
  - `--shadow-lg`: `0 4px 12px rgba(0, 0, 0, 0.12)` (Modal dialog windows and floating overlays)

---

### Iconography Standards

Applications use FontAwesome 6 Free (`fa-solid` and `fa-regular`) icons. Icons accompany textual actions or serve as primary mobile touch targets.

- **Standard Semantic Icons**:
  - Save: `<i class="fa-solid fa-floppy-disk"></i>`
  - Create / Add: `<i class="fa-solid fa-square-plus"></i>`
  - Delete: `<i class="fa-solid fa-trash"></i>`
  - Restore: `<i class="fa-solid fa-rotate-left"></i>`
  - Revert / Undo: `<i class="fa-solid fa-undo"></i>` or `<i class="fa-solid fa-rotate-left"></i>`
  - Help Reveal: `<i class="fa-solid fa-question-circle"></i>`
  - Form Valid: `<i class="fa-solid fa-check-circle"></i>` (green)
  - Form Invalid: `<i class="fa-solid fa-exclamation-circle"></i>` (red)
  - Drag Handle: `<i class="fa-solid fa-grip-vertical"></i>`
  - Search: `<i class="fa-solid fa-magnifying-glass"></i>`
  - Sync / Refresh: `<i class="fa-solid fa-rotate"></i>` or `<i class="fa-solid fa-cloud"></i>`
  - Account: `<i class="fa-solid fa-circle-user"></i>`
  - Settings: `<i class="fa-solid fa-gear"></i>`

---

### Responsive Chrome & Shell Architecture

Applications adopt a responsive two-tier layout shell defined in [`css/main-layout.css`](../../css/main-layout.css):

- **Desktop Viewport (`>= 630px`)**:
  - Top sticky header (`#sticky-top`) hosts:
    - Collapsible notification bar (`#notification-bar`).
    - Logo and app title (`#header-logo`, `#header-title`).
    - Global action bar (`#action-bar`).
    - Dropdown navigation menu (`#menu`) opening downwards.
    - Contextual action bar (`#ctx-action-bar`).
  - Bottom sticky footer (`#sticky-bottom`) displays copyright and legal notes.
  - Central content area (`<main id="content">`) accommodates card grids or centered containers (`max-width: var(--view-max-width-form)` / `var(--view-max-width-card)` / `var(--view-max-width-wide)`).
- **Mobile Viewport (`< 481px`)**:
  - Minimalist top header displaying only active alert notifications.
  - Fixed bottom bar (`#sticky-bottom`) housing the Global Action Bar, placing primary navigation within reach of the thumb.
  - Contextual actions (`#ctx-action-bar`) position directly above the bottom action bar.
  - Menu drawer opens upward from the bottom bar.
  - Footer copyright is hidden to preserve screen real estate.

---

## Visual Solutions for Recurring Editing Needs

### Form Field Anatomy & Grid Layout

The standard form field unit is `.input-group`, styled in [`css/forms.css`](../../css/forms.css) using a 4-row CSS Grid:

```text
+--------------------------------------------------------------+
| [Label Text]                             [Help (?)]  [State] |  <- Row 1: Headers & Icons
+--------------------------------------------------------------+
| [Contextual Help Description (Hidden by default)]            |  <- Row 2: Help Reveal
+--------------------------------------------------------------+
| [Input / Textarea / Select Box                             ] |  <- Row 3: Control
+--------------------------------------------------------------+
| [Validation Error Message (Hidden unless invalid)]           |  <- Row 4: Error Text
+--------------------------------------------------------------+
```

#### Specification Rules

1. **Mandatory Elements**: Every `.input-group` must contain a `<label>` with a matching `for` attribute pointing to the control ID, and an `<input>`, `<textarea>`, or `<select>`.
2. **Help Trigger**: An icon `<i class="help-icon fa fa-question-circle"></i>` occupies the `help-icon` grid column.
3. **Status Icon Slot**: The `state` column reserves space for `.valid-icon` and `.error-icon`.
4. **Spacing & Alignment**: Inputs have standard padding of `0.5rem`, `1px solid var(--form-element-border-color)`, and expand to full width (`100%`).

---

### Contextual Help Reveal Pattern

Forms use an inline tap-to-reveal pattern rather than permanent text or hover-only tooltips:

- **Initial State**: `.help-text` is hidden (`display: none;`). The help icon has muted color (`var(--form-element-text-color)`).
- **Trigger**: Clicking or tapping `.help-icon` toggles the `.help` class on the parent `.input-group`.
- **Revealed State**: `.input-group.help .help-text` becomes visible (`display: initial;`), colored with `--form-element-help-color` (`#0e6eb8`), situated immediately above the input field.

---

### Real-Time Validation States

Forms communicate validation state dynamically through classes applied to `.input-group`:

- **Pristine State**: Neither `.valid` nor `.invalid` applied. Border is neutral dark grey (`#70757a`). Error text and status icons are hidden.
- **Valid State (`.input-group.valid`)**:
  - Displays `.valid-icon` (`<i class="valid-icon fa fa-check-circle"></i>`) in green (`#21ba45`).
  - Input border switches to `--form-element-valid-color` (`#21ba45`).
  - Error text remains hidden.
- **Invalid State (`.input-group.invalid`)**:
  - Displays `.error-icon` (`<i class="error-icon fa fa-exclamation-circle"></i>`) in red (`#db2828`).
  - Displays `.error-text` in red beneath the input control.
  - Input border switches to `--form-element-invalid-color` (`#db2828`).

---

### Sub-List / Collection Item Management Pattern

Managing embedded lists of sub-items inside parent entity forms (e.g. portion units, webhook subscriptions, user settings, application grants) is standardized via the reusable `CollectionEditor` component ([`js/collection-editor.mjs`](../../js/collection-editor.mjs)) and stylesheet ([`css/collection-editor.css`](../../css/collection-editor.css)):

#### The Header Input Strip (`.collection-editor-header`)

A visually distinct dark banner (`background-color: var(--dark-grey-hex)`) that bundles creation controls in a single compact row:

```text
+-------------------------------------------------------------------------+
| [Trash Button] | [Input 1: Value] | [Input 2: Name / Key] | [Add Button]|
+-------------------------------------------------------------------------+
```

- **Delete Selected Action Button (`.delete-action`)**: Positioned on the left, rendered with a trash icon. Disabled or muted when no items are selected.
- **Inline Creation Inputs**: Clean white inputs (`background-color: var(--primary-background-color)`) with zero outer margin, allowing rapid typing without opening a modal.
- **Add Action Button (`.add-action`)**: Positioned on the right with a green hover state and `<i class="fa-solid fa-square-plus"></i>`. Pressing Enter in any input triggers immediate item creation.

#### The Collection Items List (`.collection-editor-list`)

An unstyled unordered list (`<ul>`) rendering each configured item:

- Grid or flex row alignment matching the header input strip columns.
- Individual delete trigger per item.
- Informational tags and badges.

#### Empty State Fallback

When zero items exist, a dedicated `.empty-state` container renders an explicit message explaining that no items are configured yet.

---

### Shared Empty State Component

Empty states across catalogues, dashboards, and collections are styled using the unified `.empty-state` component defined in [`css/component.css`](../../css/component.css):

- Centered flex layout with icon, descriptive heading, and secondary explanation text.
- Prominent call-to-action button (`.action-button`) leading directly to entity creation.
- Consistent vertical padding and typography across all application views.

---

### Destructive Action Protection & Reversibility

HiNoLuGi applications implement a multi-tier safety architecture for destructive operations:

1. **Soft Deletion & The Recycle Bin**:
   - Deleting entities moves them to a recycle bin with recorded deletion timestamps.
   - Restorable at any time with a single tap on `[Restore]`.
2. **Modal Confirmation Dialogs**:
   - Irreversible operations trigger a centered modal dialog (`Dialog` class from [`js/dialog.mjs`](../../js/dialog.mjs)).
   - Semi-transparent backdrop scrim (`rgba(0, 0, 0, 0.9)`).
   - High-contrast affirmative button (`"Yes, delete"`) alongside an explicit cancel button (`"No, cancel"`).
3. **Transient Feedback & Undo SnackBar**:
   - Value mutations trigger temporary feedback in `.ctx-feedback-bar` with an Undo action button.

---

### Read-Only Audit Fields

Timestamps and entity metadata (`creation-time`, `last-update-time`, `last-sign-in-time`) are presented using consistent read-only input controls:

- Rendered as `<input readonly class="last-update-time time-value">`.
- CSS rules in [`css/forms.css`](../../css/forms.css) strip borders and background colors (`border: 1px solid transparent; background-color: transparent;`).
- When focused, borders remain transparent (`input[readonly]:focus { border-color: transparent; }`).

---

### Search & Filter Toolbars

Catalogue views implement a standardized list header based on [`css/catalogue-view.css`](../../css/catalogue-view.css):

- Left/Center: `.icon-input` containing a text input with embedded search icon `<i class="fa-solid fa-magnifying-glass"></i>`.
- Right: Compact action buttons (`.action-button`) toggling filter criteria or sort modes.
- Responsive behavior: On mobile viewports, the search input stretches to fill the row while action buttons wrap or adjust sizing.

---

## Asynchronous Operations & Loading Patterns

### Top Progress Bar

- A fixed 3px indeterminate progress bar (`#app-top-progress-bar`) spans the top edge of the viewport.
- Active during non-blocking background data fetching, catalogue filtering, and periodic dashboard refreshes.
- Keeps current view interactive and fully visible without clearing the viewport.

### Inline Button Loading States

- Mutation actions triggered by buttons (saving forms, deleting entries, exporting data) toggle inline loading via `formutils.setButtonLoading(buttonEl, isLoading, loadingText)`.
- Temporarily disables the button and displays a spinning icon (`<i class="fa-solid fa-circle-notch fa-spin"></i>`).

### Cold-Start Skeleton Screens

- Cold-start view initialization uses low-contrast shimmering wireframe placeholders.
- Built using `.skeleton`, `.skeleton-card`, `.skeleton-row`, `.skeleton-text`, and `.skeleton-box` CSS tokens.
- Replaced by live data once backend responses arrive.

### Non-Blocking Wait Overlay

- Views never unmount or disappear during asynchronous background operations.
- The `.component.wait-overlay > .main` maintains high visibility (`opacity: 0.94`).

