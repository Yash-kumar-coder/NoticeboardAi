import React, { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, getDocs, where, deleteDoc, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { calculateDistance } from '../utils/distance';
import { Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import NoticeCard from '../components/NoticeCard';

const CATEGORIES = ['All', 'Study', 'Jobs', 'Rentals', 'Events', 'Coaching', 'Buy & Sell', 'Lost & Found', 'Community'];

export default function Home() {
    const { location, requestLocation } = useLocation();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [feedType, setFeedType] = useState('All'); // 'All' | 'Nearby'
    
    const [savedDocIds, setSavedDocIds] = useState({});

    useEffect(() => {
        async function fetchNotices() {
            setLoading(true);
            try {
                // Fetch saved posts first
                if (currentUser) {
                    const qSaved = query(collection(db, 'savedPosts'), where('userId', '==', currentUser.uid));
                    const savedSnapshot = await getDocs(qSaved);
                    const docIdMap = {};
                    savedSnapshot.forEach(d => {
                        const data = d.data();
                        docIdMap[data.postId] = d.id;
                    });
                    setSavedDocIds(docIdMap);
                }

                const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                
                let fetchedNotices = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Calculate distance if location is available
                if (location) {
                    fetchedNotices = fetchedNotices.map(notice => {
                        const dist = calculateDistance(
                            location.latitude, 
                            location.longitude, 
                            notice.latitude, 
                            notice.longitude
                        );
                        return { ...notice, distance: dist };
                    });
                }

                setNotices(fetchedNotices);
            } catch (error) {
                console.error("Error fetching notices:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchNotices();
    }, [location, currentUser]);

    const handleSaveToggle = async (postId) => {
        if (!currentUser) {
            toast.error("Please login to save notices.");
            navigate('/login');
            return;
        }
        try {
            if (savedDocIds[postId]) {
                await deleteDoc(doc(db, 'savedPosts', savedDocIds[postId]));
                const newMap = { ...savedDocIds };
                delete newMap[postId];
                setSavedDocIds(newMap);
            } else {
                const docRef = await addDoc(collection(db, 'savedPosts'), {
                    userId: currentUser.uid,
                    postId: postId,
                    createdAt: serverTimestamp()
                });
                setSavedDocIds({ ...savedDocIds, [postId]: docRef.id });
            }
        } catch (error) {
            console.error("Error toggling save:", error);
            toast.error("Failed to save post");
        }
    };

    const handleFeedTypeChange = (type) => {
        if (type === 'Nearby' && !location) {
            toast.error("Please enable location to view nearby posts.");
            requestLocation();
            return;
        }
        setFeedType(type);
    };

    const filteredNotices = notices.filter(notice => {
        const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
        const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (notice.description && notice.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        if (feedType === 'Nearby') {
            if (a.distance == null) return 1;
            if (b.distance == null) return -1;
            return a.distance - b.distance;
        }
        return 0; // maintain original newest-first order
    });

    return (
        <div className="pb-6">
            {/* Header */}
            <div className="bg-white pt-6 pb-4 px-6 sticky top-0 z-10 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-gray-500 text-sm">Welcome </h2>
                        <button 
                            onClick={!location ? requestLocation : undefined}
                            className="flex items-center gap-1 text-primary font-semibold mt-0.5"
                        >
                            <MapPin size={16} />
                            <span>{location ? "Nearby You" : "Enable Location"}</span>
                        </button>
                    </div>
                    <img src="/logo.png" alt="NearNotice" className="w-17 h-17 rounded-xl  object-cover" />
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search notices, jobs, rentals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Feed Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                    <button 
                        onClick={() => handleFeedTypeChange('All')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${feedType === 'All' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All Posts
                    </button>
                    <button 
                        onClick={() => handleFeedTypeChange('Nearby')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${feedType === 'Nearby' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Nearby Posts
                    </button>
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                selectedCategory === category 
                                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed */}
            <div className="px-6 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Recent Notices</h3>
                </div>

                {!location && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-4 text-sm flex justify-between items-center">
                        <span>Enable location to see nearby notices.</span>
                        <button onClick={requestLocation} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors">
                            Enable
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredNotices.length > 0 ? (
                    filteredNotices.map(notice => (
                        <NoticeCard 
                            key={notice.id} 
                            notice={notice} 
                            distance={notice.distance}
                            isSaved={!!savedDocIds[notice.id]}
                            onSaveToggle={handleSaveToggle}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <p>No notices found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
