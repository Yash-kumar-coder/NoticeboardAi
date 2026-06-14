import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { isConfigValid } from './firebase/config';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import NoticeDetails from './pages/NoticeDetails';
import MyPosts from './pages/MyPosts';

function App() {
  if (!isConfigValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Firebase Setup Required</h1>
          <p className="text-gray-600 mb-6">
            The application cannot start because Firebase credentials are missing. 
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-xl text-sm text-gray-800 font-mono overflow-x-auto">
            Please add your keys to the <span className="font-bold text-primary">.env</span> file in the project root.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <Layout>
                <Home />
              </Layout>
            } />
            
            <Route path="/post" element={
              <ProtectedRoute>
                <Layout>
                  <CreatePost />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/saved" element={
              <ProtectedRoute>
                <Layout>
                  <Saved />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/notice/:id" element={
              <Layout>
                <NoticeDetails />
              </Layout>
            } />
            
            <Route path="/my-posts" element={
              <ProtectedRoute>
                <Layout>
                  <MyPosts />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
