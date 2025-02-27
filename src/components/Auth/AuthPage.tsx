import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { MessageCircle, Video } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/rooms" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <MessageCircle size={32} className="text-white mr-2" />
          <Video size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">WebRTC Chat App</h1>
        <p className="text-white text-lg">Connect with friends through text, audio, and video</p>
      </div>
      
      <div className="w-full max-w-md">
        {isLogin ? <LoginForm /> : <RegisterForm />}
        
        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:underline focus:outline-none"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-white text-center">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Text Chat</h3>
            <p>Send and receive messages in real-time with other room participants</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Audio Calls</h3>
            <p>Crystal clear audio calls with anyone in your room</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Video Calls</h3>
            <p>Face-to-face communication with high-quality video</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;