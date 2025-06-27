# Budget Tracker App

A mobile-friendly personal finance tracker built with React, Tailwind CSS, and Firebase.

## Features

- 🔐 User authentication with Firebase Auth
- 💰 Track income and expenses with categories
- 📊 Monthly budget management
- 📈 Visual charts showing budget vs actual spending
- 📱 Mobile-responsive design
- 🔄 Real-time data synchronization

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date handling**: date-fns

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts (Auth, etc.)
├── firebase/           # Firebase configuration
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # App constants
└── styles/             # CSS styles
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd budgeting-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings

4. **Configure environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your Firebase configuration:

   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**

   In Firebase Console > Firestore Database > Rules, add:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;

         match /transactions/{transactionId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }

         match /budgets/{budgetId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```

6. **Start the development server**

   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Database Schema

### Users Collection

```
users/{userId}
├── email: string
├── displayName: string
├── createdAt: timestamp
└── settings: object
    ├── currency: string
    └── theme: string
```

### Transactions Subcollection

```
users/{userId}/transactions/{transactionId}
├── amount: number
├── category: string
├── date: timestamp
├── description: string
└── type: 'income' | 'expense'
```

### Budgets Subcollection

```
users/{userId}/budgets/{categoryId}
├── name: string
├── monthlyLimit: number
└── month: string (YYYY-MM)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or create an issue in the repository.
