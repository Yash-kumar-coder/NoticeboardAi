import React from 'react';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
