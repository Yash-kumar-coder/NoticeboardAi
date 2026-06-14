import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Bookmark, User } from 'lucide-react';

export default function BottomNav() {
    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/post', label: 'Post', icon: PlusCircle },
        { path: '/saved', label: 'Saved', icon: Bookmark },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => 
                                `flex flex-col items-center p-2 min-w-[64px] ${isActive ? 'text-primary' : 'text-gray-500'}`
                            }
                        >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
