# Copilot Instructions

This document provides guidance for AI agents working on the Thunderball Promo Board codebase.

## Project Overview

This is a self-contained, single-page web application for managing a promotional prize board game called "Thunderball". It is built with vanilla JavaScript, HTML, and CSS, and is designed to run entirely in a web browser without a server or a build step.

The core of the application is in `app.js`, which manages the game state, renders the UI, and handles all user interactions.

## Architecture

-   **`index.html`**: The single HTML file that defines the structure of the application, including the prize board and the management panel.
-   **`style.css`**: Contains all styling, animations, and theme information (dark/light modes).
-   **`app.js`**: The brain of the application. This file contains all the logic for state management, UI updates, event handling, and data persistence. It is written as a single Immediately-Invoked Function Expression (IIFE).
-   **`shuffle.js`**: A utility script for developers, written for Node.js. It is used to pre-shuffle prize data from a CSV file into a JSON file. It is **not** part of the client-side application.
-   **Data Files (`.csv`, `.json`)**: These files contain prize data. `Thunderball.csv` is the default set of prizes. Other files like `thunderball_state_day19_shuffled.json` represent specific game states that can be loaded into the application.

## State Management

The application's state is managed by a single JavaScript object within `app.js`. This object is persisted to the browser's `localStorage` under the key `thunderballStateV1`.

The state object includes:
-   The current game "day".
-   An array of prize objects, each with properties like `number`, `basePrize`, `isSpecial`, `isClaimed`, etc.
-   Settings for the game, such as the daily increment for special prizes.

Refer to the `Data Model` section in `README.md` for a detailed schema of the state object. When making changes, ensure that the logic correctly loads from and saves to this `localStorage` entry.

## Developer Workflow

-   **Running the App**: To run the application, simply open `index.html` in a web browser. There are no build or compilation steps.
-   **Management Panel**: The primary tool for debugging and managing the game is the management panel. It can be opened by pressing the backtick (`) key. This panel provides access to game settings, state import/export, and other controls.
-   **Data Persistence**: All changes made in the application are automatically saved to `localStorage`. To reset the application state, use the "Clear Local Storage" button in the management panel.
-   **Import/Export**: The application can import and export its state as a JSON or CSV file. JSON is the preferred format as it preserves the complete state, including `accrualDays` for special prizes.

## Key Conventions

-   All client-side logic resides in `app.js`.
-   DOM manipulation is done using standard vanilla JavaScript (`document.getElementById`, etc.).
-   The application is designed to be offline-first, relying on `localStorage` and local data files.
-   The `README.md` is the primary source of truth for project documentation and should be consulted for details on features and data structures.
