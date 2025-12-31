# Copilot Instructions

This document provides essential guidance for AI agents working on the Thunderball Promo Board codebase. For more detailed documentation, refer to `README.md`.

## Project Overview

This is a self-contained, single-page web application for managing a promotional prize board game. It is built with vanilla JavaScript, HTML, and CSS, and runs entirely in the browser with no build step.

## Core Architecture

-   **`app.js`**: The brain of the application. This single IIFE contains all logic for state management, UI updates, event handling, and data persistence. **All client-side changes will likely be in this file.**
-   **`index.html`**: The single HTML file defining the application structure.
-   **`style.css`**: All styling, including themes and animations.
-   **`shuffle.js`**: A Node.js utility script for developers to pre-shuffle prize data. It is **not** part of the client-side application.

## State Management

The entire application state is managed by a single JavaScript object within `app.js` and persisted to `localStorage` under the key `thunderballStateV1`. The state object contains the game day, prize array, and settings. When making changes, ensure logic correctly loads from and saves to this `localStorage` entry.

## Developer Workflow

-   **Running the App**: Open `index.html` in a web browser.
-   **Management Panel**: The primary tool for debugging and managing the game is the management panel, opened by pressing the backtick (`) key. This provides access to all game settings and controls.
-   **Data Persistence**: All state changes are automatically saved to `localStorage`. Use the "Clear Local Storage" button in the management panel to reset.
