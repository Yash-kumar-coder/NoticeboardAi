import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { Settings, LogOut, FileText, Bookmark, MessageSquare, ChevronRight, MapPin, Bell, Shield, HelpCircle, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useLocation } from '../contexts/LocationContext';

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const { requestLocation } = useLocation();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        posts: 0,
        saved: 0,
        views: 0,
        contacts: 0 // Mock for MVP
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            if (!currentUser) return;
            try {
                // Count posts
                const qPosts = query(collection(db, 'posts'), where('userId', '==', currentUser.uid));
                const postSnap = await getDocs(qPosts);
                let totalViews = 0;
                postSnap.forEach(doc => {
                    totalViews += (doc.data().views || 0);
                });
                
                // Count saved
                const qSaved = query(collection(db, 'savedPosts'), where('userId', '==', currentUser.uid));
                const savedSnap = await getCountFromServer(qSaved);
                
                setStats({
                    posts: postSnap.size,
                    saved: savedSnap.data().count,
                    views: totalViews,
                    contacts: Math.floor(totalViews * 0.1) // Mock contact rate for UI
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        }
        
        fetchStats();
    }, [currentUser]);

    const handleEditProfile = () => {
        setEditName(currentUser?.displayName || '');
        setIsEditing(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        setSavingProfile(true);
        try {
            await updateProfile(currentUser, {
                displayName: editName.trim()
            });
            toast.success("Profile updated successfully");
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-6">
            <div className="bg-white pt-10 pb-6 px-6 flex flex-col items-center border-b border-gray-100 relative">
                
                <div className="w-24 h-24 rounded-full bg-blue-100 overflow-hidden mb-4 border-4 border-white shadow-lg">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                            {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900">{currentUser?.displayName || 'User'}</h2>
                <div className="flex flex-col items-center text-gray-500 text-sm mt-1 gap-1">
                    <span className="flex items-center gap-1">✉ {currentUser?.email}</span>
                    {currentUser?.phoneNumber && <span className="flex items-center gap-1">📞 {currentUser?.phoneNumber}</span>}
                </div>
                
                <button 
                    onClick={handleEditProfile}
                    className="mt-4 bg-primary text-white px-6 py-2 rounded-full font-medium shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors"
                >
                    Edit Profile
                </button>
            </div>

            {/* Stats */}
            <div className="flex justify-between px-6 py-6 bg-white mb-2">
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-primary">{stats.posts}</span>
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">My Posts</span>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-primary">{stats.saved}</span>
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">Saved</span>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-primary">{stats.views >= 1000 ? (stats.views/1000).toFixed(1)+'k' : stats.views}</span>
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">Views</span>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-primary">{stats.contacts}</span>
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">Contacts</span>
                </div>
            </div>

            {/* Links */}
            <div className="px-4 py-2">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100">
                    <button onClick={() => navigate('/my-posts')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-primary"><FileText size={20} /></div>
                            <div className="text-left">
                                <div className="font-semibold text-gray-900 text-sm">My Posts</div>
                                <div className="text-xs text-gray-500">Manage your active listings</div>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300" size={20} />
                    </button>
                    <button onClick={() => navigate('/saved')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-primary"><Bookmark size={20} /></div>
                            <div className="text-left">
                                <div className="font-semibold text-gray-900 text-sm">Saved Notices</div>
                                <div className="text-xs text-gray-500">View your saved items</div>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300" size={20} />
                    </button>
                </div>

                <div className="font-semibold text-gray-900 mb-2 px-2 text-sm">Account Settings</div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-100">
                    {[
                        { 
                            icon: MapPin, 
                            label: 'Refresh Location', 
                            onClick: () => {
                                const toastId = toast.loading("Updating location...");
                                requestLocation();
                                setTimeout(() => toast.success("Location updated successfully", { id: toastId }), 1000);
                            }
                        },
                        { 
                            icon: Shield, 
                            label: 'Privacy & Security', 
                            onClick: () => toast('Privacy settings coming soon in v2!', { icon: '🔒' }) 
                        },
                        { 
                            icon: HelpCircle, 
                            label: 'Help & Support', 
                            onClick: () => toast('Help & Support coming soon in v2!', { icon: '🎧' }) 
                        },
                        { 
                            icon: Info, 
                            label: 'About App', 
                            onClick: () => toast('NoticeBoard AI v1.0.0 MVP', { icon: 'ℹ️' }) 
                        }
                    ].map((item, idx, arr) => (
                        <button 
                            key={item.label} 
                            onClick={item.onClick}
                            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${idx !== arr.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                            <div className="flex items-center gap-3 text-gray-700">
                                <item.icon size={20} className="text-gray-400" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="text-gray-300" size={18} />
                        </button>
                    ))}
                </div>

                <button 
                    onClick={logout}
                    className="w-full bg-white border border-red-200 text-red-500 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
                >
                    <LogOut size={20} /> Log Out
                </button>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Edit Profile</h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    placeholder="Enter your name"
                                    autoFocus
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={savingProfile}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2 hover:bg-primary-dark transition-colors disabled:opacity-70"
                            >
                                {savingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
