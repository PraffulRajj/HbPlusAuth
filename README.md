# HbPlusAuth

A cross-platform Google Authentication application built using React Native, Expo, and Firebase. The application restricts access to users with an authorized `@hbplus.fit` email address.

## Features

- Google Sign-In using Firebase Authentication
- Email domain restriction (`@hbplus.fit`)
- Unauthorized user access rejection
- Login and authentication state handling
- Responsive interface using Expo and React Native Web
- Protected dashboard and logout functionality

## Tech Stack

- React Native
- Expo
- React Native Web
- Firebase Authentication
- JavaScript

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- VS Code
- Firebase account

### Installation

Clone the repository:

```bash
git clone https://github.com/PraffulRajJ/HbPlusAuth.git
```

Navigate to the project directory:

```bash
cd HbPlusAuth
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npx expo start --web
```

The application will be available at:

```text
http://localhost:8081
```

## Firebase Configuration

1. Create a Firebase project.
2. Enable Google as a sign-in provider under Authentication.
3. Configure the Firebase Web SDK.
4. Add `localhost` to Firebase Authentication's authorized domains.
5. Configure the Firebase authentication settings.

The Firebase configuration is located in:

`src/firebase/config.js`

## Authentication Flow

1. The user clicks **Continue with Google**.
2. Google authentication is initiated through Firebase.
3. The application retrieves the authenticated user's email.
4. The email domain is checked against the authorized domain.
5. Users with the authorized `@hbplus.fit` domain can access the application.
6. Unauthorized users receive an access-denied message.
7. Authorized users can access the dashboard and log out.

## Domain Restriction

The application uses the following authorized domain:

```javascript
const ALLOWED_DOMAIN = "hbplus.fit";
```

Only users whose email addresses end with `@hbplus.fit` should be allowed access.

Domain validation should be enforced using the authenticated user's email and appropriate backend or Firebase security controls.

## Testing

| Test Case | Expected Result |
|---|---|
| Authorized `@hbplus.fit` account | Dashboard access |
| Personal Gmail account | Access denied |
| Logout | Return to login screen |

## Deployment

The web application can be deployed using Netlify.

Deployment link: **Add your live deployment URL here after deployment.**

## Author

Prafful Raj

GitHub: [PraffulRajJ](https://github.com/PraffulRajJ)