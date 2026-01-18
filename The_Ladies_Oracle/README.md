# The Ladies Oracle

Welcome to The Ladies Oracle, a mystical mobile application designed to provide guidance and insight. This project is a complete application suite, including a mobile front-end and a supporting back-end.

## Project Overview

"The Ladies' Oracle" is a modern digital take on classic divination tools. It allows users to create a profile, ask questions, and receive answers from the oracle.

This repository contains two main parts:

-   **/The_Ladies_Oracle**: The mobile application built with Expo (React Native).
-   **/backend**: The backend server that powers the app's features.

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Expo Go](https://expo.dev/go) app on your Android or iOS device (for testing)
-   [Android Studio](https://developer.android.com/studio) or [Xcode](https://developer.apple.com/xcode/) for running on emulators/simulators.
-   A configured Firebase project.

### 1. Backend Setup

First, set up and run the backend server.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

*Note: Additional configuration, such as creating a `.env` file with database credentials or API keys, may be required. Please refer to any specific documentation within the `backend` directory.*

### 2. Frontend Setup

With the backend running, you can now start the mobile application.

```bash
# Navigate to the frontend directory
cd The_Ladies_Oracle

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

In the output, you'll find options to open the app in:

-   An [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
-   An [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
-   The [Expo Go](https://expo.dev/go) app on your physical device.

---

## Features

-   **User Authentication**: Secure sign-up and login functionality.
-   **User Profiles**: View and manage your profile information, including display name and membership date.
-   **Oracle Questions**: Select from a list of questions to ask the oracle.
-   **Mystical Answers**: Receive guidance and answers to your chosen questions.

---

## Technology Stack

-   **Frontend**: [Expo](https://expo.dev/), [React Native](https://reactnative.dev/), [Firebase](https://firebase.google.com/)
-   **Backend**: Node.js, Express
-   **Database**: Firestore

---

## About

This application is a product of [theladiesoracle.com](https://theladiesoracle.com/).
© 2025 theladiesoracle App v1.0
