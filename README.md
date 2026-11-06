# HBPlus Authentication System

A secure authentication and role-based access management application built using React Native Web and Firebase.

## Features

- Google Authentication using Firebase
- Company email domain authorization (`@hbplus.fit`)
- Firebase Authentication state management
- Firestore user profile creation and storage
- Role-based access control (Admin and User)
- Admin dashboard with registered user management
- Protected dashboard access
- Logout functionality
- Responsive interface

## Tech Stack

- React Native Web
- JavaScript
- Firebase Authentication
- Cloud Firestore
- Google OAuth
- Netlify

## Authentication Flow

1. User signs in using Google.
2. Firebase authenticates the user.
3. Application validates the user's email domain.
4. User profile is created or updated in Firestore.
5. User role is retrieved from Firestore.
6. Admin or User dashboard is displayed based on the assigned role.

## Firestore Structure

```text
users/
  {uid}/
    uid
    email
    displayName
    photoURL
    role
    createdAt
    lastLoginAt
```

## Installation

Clone the repository:

```bash
git clone https://github.com/PraffulRajj/HbPlusAuth.git
cd HbPlusAuth
```

Install dependencies:

```bash
npm install
```

Configure Firebase credentials in:

```text
src/firebase/config.js
```

Start the application:

```bash
npm start
```

## Security

- Firebase Authentication handles user identity.
- Firestore Security Rules restrict access.
- Users cannot modify their own role.
- Admin access is restricted through role checks.
- Firebase manages authentication token refresh.

## Deployment

Live Application: https://hbplus-auth-prafful.netlify.app

GitHub Repository: https://github.com/PraffulRajj/HbPlusAuth

## Developer

Prafful Raj

B.Tech Computer Science Engineering

Amity University Jharkhand