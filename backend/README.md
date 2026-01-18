# The Ladies Oracle - Backend

This directory contains the backend server for "The Ladies Oracle" mobile application. It's a Node.js application built with Express, responsible for handling user data, authentication, and providing the core logic for the app's features.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- A configured Firebase project, specifically Firestore for the database.

### Installation & Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    This project may require environment variables for configuration (e.g., database credentials, API keys, port). Create a `.env` file in this directory and add the necessary variables.

    Example `.env` file:
    ```
    PORT=3000
    FIREBASE_PROJECT_ID=your-firebase-project-id
    # Add other necessary variables
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```
    The server will typically start on `http://localhost:3000` (or the port specified in your `.env` file).

---

## API Endpoints

The backend provides the following API endpoints to support the mobile application:

-   **`POST /user/update`**: Updates a user's profile information.
    -   **Body**: `{ "email": "user@example.com", "name": "New Name", "avatarUri": "new_avatar_url" }`
    -   **Description**: Updates the user's display name and avatar in the database.

*(Note: Other endpoints for authentication, fetching questions, and retrieving answers also exist. This documentation will be updated as the API evolves.)*

---

## Technology Stack

-   **Framework**: [Express.js](https://expressjs.com/)
-   **Language**: Node.js
-   **Database**: Firestore

---

## About

This backend is part of "The Ladies Oracle" application suite.

© 2025 theladiesoracle App v1.0
