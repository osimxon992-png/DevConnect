---
name: DevConnect
description: A corridor noticeboard for developers. Paper sheets and coloured flyers on a hallway wall.
colors:
  shell-yellow: "#ffd21f"
  project-pink: "#f4669f"
  question-blue: "#2e9bd6"
  job-green: "#5dbb63"
  group-orange: "#ff8c3a"
  hallway-wall: "#e6e8e1"
  hallway-wall-deep: "#d9dcd3"
  paper: "#ffffff"
  photocopy-ink: "#111111"
  pencil: "#55574f"
  rule: "#cfd2c8"
  field-stroke: "#8d8f87"
  stamp-red: "#c8102e"
  code-bg: "#161616"
  code-ink: "#ecebe4"
typography:
  display:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "clamp(4rem, 11vw, 9.5rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  flyer-title:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 0.95
    fontVariation: "'wdth' 62"
  section:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 70"
  title:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 800
    lineHeight: 1.12
    fontVariation: "'wdth' 80"
  body:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Archivo Variable', Archivo, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 800
    letterSpacing: "0.06em"
  code:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.84rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "26px"
  gutter: "32px"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "9px 16px"
    height: "40px"
  button-hover:
    backgroundColor: "{colors.shell-yellow}"
  button-primary:
    backgroundColor: "{colors.photocopy-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "9px 16px"
    height: "40px"
  button-primary-hover:
    textColor: "{colors.shell-yellow}"
  button-warm:
    backgroundColor: "{colors.project-pink}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "9px 16px"
  button-sm:
    padding: "5px 11px"
    height: "32px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "42px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "20px 22px"
  flyer-project:
    backgroundColor: "{colors.project-pink}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px 16px"
  flyer-question:
    backgroundColor: "{colors.question-blue}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
  flyer-job:
    backgroundColor: "{colors.job-green}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px 16px"
  flyer-group:
    backgroundColor: "{colors.group-orange}"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px 16px"
  nav-link:
    textColor: "{colors.photocopy-ink}"
    padding: "8px 10px"
  nav-link-active:
    backgroundColor: "{colors.photocopy-ink}"
    textColor: "{colors.shell-yellow}"
  tab-active:
    backgroundColor: "{colors.photocopy-ink}"
    textColor: "{colors.paper}"
    padding: "8px 14px"
  chip:
    backgroundColor: "#eef0ea"
    textColor: "{colors.photocopy-ink}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  count:
    backgroundColor: "{colors.photocopy-ink}"
    textColor: "{colors.shell-yellow}"
    height: "20px"
---

# Design System: DevConnect

## Overview

**Creative North Star: "The Corridor Noticeboard"**

DevConnect is the noticeboard outside a computer science department. The ground is a grey hallway wall. Posts are plain white sheets pinned to it, each lifted by a hairline paper shadow and nothing else. Projects, questions, jobs and groups are flyers on coloured copy paper, so a developer recognises the kind of thing before reading a word. The shell itself (sidebar, mobile bar, notices, modal heads) is solar yellow: the department's own board header.

Everything is printed in photocopy ink. Type is one family, Archivo, ranked by width and weight: condensed, black, uppercase for things you read from across the corridor; normal width for things you read up close. Code is the only place JetBrains Mono appears, on black slabs like a terminal printout taped to the board. Corners are cut square everywhere. There are no gradients, no glows, no purple; the owner rejected those as "obviously AI-made", and the paper metaphor has no use for them.

Density is that of a busy board: dense but calm. Colour carries meaning (content type), ink carries structure (2px rules, reversed active states), and the paper does the rest.

**Key Characteristics:**
- Grey wall, white sheets, coloured flyers by content type, yellow shell.
- Ink #111 plus one pencil grey; no other text colours on paper.
- Archivo only, ranked by width (62 to 100) and weight; mono for code only.
- Zero radius on every surface and control.
- Hairline paper shadow; lift only on hover and for floating layers.
- Signature: perforated tear-off role tabs at the foot of project flyers.
- State as marks in fixed cells: hollow square open, filled square solved.

## Colors

Copy-paper brights on a neutral hallway grey, printed in black ink. Each bright has exactly one job.

### Primary
- **Solar Shell Yellow** (shell-yellow): the board header. Sidebar, mobile top bar, landing and auth panels, dashboard notice, modal heads, selection highlight, hover fill for plain buttons and menu items, focus ring halo on inputs.

### Secondary (content-type copy paper)
- **Project Pink** (project-pink): project flyers, the warm button, unread dot and the mobile nav count.
- **Question Blue** (question-blue): question flyers.
- **Job Green** (job-green): job flyers, the accepted-answer inset and active upvote.
- **Group Orange** (group-orange): group flyers.

### Tertiary
- **Stamp Red** (stamp-red): danger only. Destructive buttons, error text, error toast, active downvote, alert stroke.

### Neutral
- **Hallway Wall** (hallway-wall): the page ground, and the colour a torn-off tab leaves behind.
- **Hallway Wall Deep** (hallway-wall-deep): secondary wall tone.
- **Paper** (paper): post sheets, cards, inputs, buttons, modals.
- **Photocopy Ink** (photocopy-ink): all text, 1.5px control strokes, 2px structural rules, reversed active states, primary buttons, avatars and covers.
- **Pencil** (pencil): secondary text on paper (meta, hints, page-head descriptions).
- **Rule** (rule): 1px dividers inside sheets (post actions, table rows, rail items, chat list).
- **Field Stroke** (field-stroke): resting input border; ink replaces it on focus.
- **Code Black / Code Ink** (code-bg, code-ink): code blocks and code textareas.

### Named Rules
**The Copy Paper Rule.** Each bright means one content type: pink is projects, blue is questions, green is jobs, orange is groups, yellow is the shell. Never use a bright decoratively or swap two of them.

**The No Gradient Rule.** Every fill is flat. No gradients, no glows, no purple or violet anywhere. This is an owner commitment, not a preference.

**The Ink On Paper Rule.** Text on any flyer stays photocopy ink (#111); muted text on a flyer darkens to #2b2b2b rather than going pencil grey.

## Typography

**Display Font:** Archivo (variable, wdth 62..125, wght 100..900), with system-ui fallback
**Label/Mono Font:** JetBrains Mono, with ui-monospace fallback, for code only
**Source:** both faces ship in the bundle via `@fontsource-variable/archivo/wdth.css` and `@fontsource-variable/jetbrains-mono` (imported in `src/main.jsx`); no hosted font stylesheet.

**Character:** One grotesque stretched two ways. Condensed black uppercase shouts like a printed flyer heading; normal-width regular reads like a typed notice.

### Hierarchy
- **Display** (900, wdth 62, clamp(4rem, 11vw, 9.5rem), 0.82, uppercase): the DEVCONNECT wordmark on landing; the same treatment at 2.9rem in the sidebar.
- **Headline** (900, wdth 62, 2.6rem, 0.95, uppercase): page h1; 2.1rem on phones.
- **Flyer Title** (900, wdth 62, 2rem, 0.95, uppercase): project, job and group flyer names; 1.7rem in the rail.
- **Section** (800, wdth 70, 1.55rem, uppercase): h2 section heads; tabs use 800 at wdth 75, 1rem, uppercase.
- **Title** (800, wdth 80, 1.3rem, 1.12): question titles and developer names (1.15rem); sentence case.
- **Body** (400, 15px, 1.55): posts and descriptions, capped at 60 to 70ch.
- **Label** (800, 0.72 to 0.78rem, letter-spacing 0.05 to 0.1em, uppercase): form labels, table heads, stat and vote-cell captions, sidebar group headings.
- **Code** (JetBrains Mono, 0.84rem, 1.65): code blocks; the block header is mono 500, 0.74rem, lowercase.

### Named Rules
**The Width Ranks Rule.** Rank by width and weight, not by switching families. Narrower and heavier means louder. Never introduce a second display face.

**The Mono Is Code Rule.** JetBrains Mono appears only where code appears. Labels, counts and meta stay in Archivo with tabular numerals.

## Layout

Desktop is a three-column board: a 248px sticky yellow sidebar, a fluid main column (padding 26px 32px 48px, 20px vertical gap), and a 320px sticky right rail of flyers. Below 1240px the rail goes and the sidebar narrows to 220px. Below 820px the sidebar is replaced by a sticky yellow top bar and a fixed black bottom nav whose active item is a yellow block; main padding drops to 16px and tab rows scroll sideways instead of wrapping.

Content sits in auto-fill grids (minimum 250px, or 320px for wide grids, 18px gap) aligned to the top, and in stacks with a 14px gap. Page heads end with a 2px ink rule. Landing splits into a yellow wordmark panel and a two-column board of live flyers (first flyer spans both); auth uses a 38% yellow side panel. Both collapse to one column below 900px and 820px respectively.

## Elevation & Depth

Depth is paper on a wall: one hairline sheet shadow at rest, a lifted shadow only when something is picked up or floats above the board. No borders on sheets; the shadow and the wall contrast separate them.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 0 rgba(17,17,17,0.06), 0 1px 3px rgba(17,17,17,0.12)`): every card, flyer, chat bubble and the search field at rest.
- **Lifted** (`box-shadow: 0 2px 4px rgba(17,17,17,0.1), 0 10px 24px rgba(17,17,17,0.14)`): hoverable cards on hover (with translateY(-2px)), modals, menus, toasts.

### Named Rules
**The Pinned Sheet Rule.** At rest everything is a pinned sheet. Lift is a response to the pointer or a floating layer, never a resting decoration.

## Shapes

Square-cut paper. Radius is 0 on every element, set globally. Lines come in three weights: 1px rule grey inside sheets, 1.5px ink on controls, 2px ink for structure (page-head underline, tab-row underline, question vote-cell divider, chat header). Dashed 2px ink lines mean perforation and appear only on tear-off tabs. Status marks and the unread dot are small squares, never circles. Photos on flyers are greyscale with raised contrast and multiplied into the paper colour, like a photocopy.

## Components

### Buttons
Printed and plain: a white slip with an ink edge.
- **Shape:** square (0px), 1.5px ink border, min-height 40px (32px small).
- **Default:** paper fill, ink text, 700 weight, 0.9rem. Hover fills shell yellow; active nudges down 1px.
- **Primary:** ink fill, white text; hover keeps ink and turns the text yellow.
- **Warm:** project pink fill, for invitations to act on a project.
- **Ghost:** no border, transparent; hover is a 7% ink tint.
- **Danger:** red border and text; hover fills red with white text.
- **Disabled:** 45% opacity, no hover.

### Chips
- **Style:** square, 2px 8px, 0.78rem 600. Neutral chip is #eef0ea; tag chips are transparent with a 1px inset ink line; status chips take the content-type bright. On a flyer the neutral chip becomes 55% white so the paper shows through.
- **State:** filter chips are paper with a 1.5px inset ink line; selected reverses to ink with yellow text.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** paper for posts and general sheets; content-type brights for flyers; yellow for notices.
- **Shadow Strategy:** sheet at rest, lifted on hover where the card is a link (see Elevation).
- **Border:** none. Inner dividers are 1px rule grey.
- **Internal Padding:** 20px 22px for sheets, 18px 20px 16px for flyer bodies.

### Inputs / Fields
- **Style:** paper fill, 1.5px field-stroke border, square, 10px 12px, min-height 42px. Labels sit above in the uppercase label style.
- **Focus:** border turns ink and a 3px solid yellow halo appears (no blur).
- **Error:** red 600 text under the field. Code textareas are code-black with code-ink text.
- **Search:** borderless paper with the sheet shadow, icon inset left; same yellow focus halo.

### Navigation
- **Sidebar:** yellow column, condensed wordmark, nav as plain rows (600, 0.98rem, 8px 10px) with an icon. Hover is an 8% ink tint; active reverses to ink with yellow text and the count flips to yellow on ink.
- **Tabs:** condensed uppercase row over a 2px ink underline; active tab reverses to ink with white text.
- **Mobile:** yellow sticky top bar with wordmark and search; fixed ink bottom bar, active item a yellow block.

### Flyer
A coloured copy-paper sheet for one content type. Condensed black uppercase title, body at 0.92rem, chips, then a foot row of owner and counts pushed to the bottom. Optional photo at 16:9, greyscale and multiplied. Question flyers add a fixed 76px vote column on the left, divided by a 2px ink rule, with condensed black numerals and uppercase captions.

### Tear-off Role Tabs (signature)
The foot of a project flyer is a perforated strip: a 2px dashed ink line along the top and between tabs, each tab 112px tall with the role name set vertically. An open role is a button; hover lightens it and lifts it 4px as if being pulled. A taken role is a missing tab: filled with the wall colour and its label hidden, so the gap in the row is the information. Tapping an open tab starts a join request for that role.

### Status Marks
A 13px square with a 2px ink stroke before the status word. Hollow means open; filled ink means solved. Used in fixed position at the head of the question body.

### Code Block
Code-black slab with a 1px darker header row showing the language in lowercase mono and a copy action; body in JetBrains Mono 0.84rem/1.65, horizontally scrollable. Selection inside code is yellow on ink.

## Do's and Don'ts

### Do:
- **Do** colour a flyer by its content type only: projects pink, questions blue, jobs green, groups orange.
- **Do** keep the shell (sidebar, mobile bar, notices, modal heads) solar yellow.
- **Do** set text in photocopy ink (#111) or pencil grey (#55574f) and nothing else on paper.
- **Do** rank headings by Archivo width and weight: wdth 62 at 900 for the loudest, normal width for reading.
- **Do** use the sheet shadow at rest and the lifted shadow only on hover or floating layers.
- **Do** show state with square marks in fixed cells: hollow open, filled solved.
- **Do** reverse to ink for active navigation, tabs and selected chips.

### Don't:
- **Don't** use gradients, glows, or purple/violet anywhere.
- **Don't** round any corner; radius is 0 on every surface, control and mark.
- **Don't** give sheets borders; use the sheet shadow against the wall.
- **Don't** use a content-type bright for decoration or for a different content type.
- **Don't** set labels, counts or meta in JetBrains Mono; mono is for code.
- **Don't** use dashed lines anywhere except the tear-off perforation.
