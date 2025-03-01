# WebRTC Chat Application

A full-stack real-time communication web application that enables text chat, audio calls, and video calls between users in shared rooms.

## Features

- Multi-user chat rooms with unique room codes
- Text-based chat functionality
- Audio calling between room participants
- Video calling between room participants
- Real-time user presence indicators
- Screen sharing
- User authentication system
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.io
- **Video/Audio Calls**: WebRTC
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   npm install
   ```
3. Install backend dependencies:
   ```
   cd server
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm start
   ```
2. In a separate terminal, start the frontend:
   ```
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Register a new account or log in
2. Create a new room or join an existing one with a room ID
3. Share the room ID with others to invite them
4. Start chatting, make audio calls, or video calls with participants

## Security Features

- JWT authentication
- Secure WebRTC connections
- Input validation
- Rate limiting
- Room access control

## Project Video

https://github.com/user-attachments/assets/949e9318-b5b7-47d9-b479-351c58bbf815

## Project Structure

```
├── public/              # Static files
├── server/              # Backend server
│   ├── index.js         # Express server and Socket.io setup
│   └── package.json     # Backend dependencies
├── src/
│   ├── components/      # React components
│   │   ├── Auth/        # Authentication components
│   │   └── Room/        # Room and chat components
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
└── package.json         # Frontend dependencies
```

## License

This project is licensed under the MIT License.
