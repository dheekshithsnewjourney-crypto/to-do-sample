# Product

<!-- impeccable:product-schema 1 -->
<!-- Facts marked (inferred) come from the README and code, not from an interview. The owner's laws ask not to be interviewed on what the repo answers. -->

## Platform

web

## Users
One person managing their own tasks on a laptop and a phone (inferred: no accounts, no sharing, data lives in the browser). They open it several times a day: add a task in passing, check what is due today, tick things off.

## Product Purpose
A fast personal to-do list: add a task in one line, see what is due, finish it, undo mistakes. Success is a list that is trusted and quick: nothing lost, nothing hidden, every action reachable from the keyboard.

## Positioning
Quick-add that reads plain language ("Pay rent tomorrow !high"), smart views (Today, Upcoming, Overdue), recurring tasks that never pile up, a command palette, full keyboard and screen-reader support, and no account: everything stays on the device with export/import backups.

## Operating Context
Used in short bursts many times a day, mostly by keyboard on desktop and by thumb on a phone. Light and dark themes both matter. Data: tasks with priority, due date, list, notes, subtasks and repeat.

## Capabilities and Constraints
- Must keep: every feature and behavior covered by the 143 tests (quick-add parsing, views, recurring logic, undo, drag and keyboard reorder, drawer, palette, import/export, accent colour).
- Stack: React 19 + TypeScript + Vite, plain CSS, deployed to GitHub Pages with a CSP (no external scripts; fonts only from Google Fonts).
- Accessibility: WCAG AA contrast checked by script, full keyboard operation, reduced-motion support.

## Brand Commitments
- Owner-pinned palette: red #D62839, yellow #FFC53D, white/black neutrals. Type, layout and signature element must change from the previous design (Bricolage Grotesque + Inter, sidebar + list shell, progress ring).
