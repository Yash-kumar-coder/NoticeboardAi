import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import NoticeCard from '../components/NoticeCard';
import { calculateDistance } from '../utils/distance';
import { BookmarkMinus } from 'lucide-react';

export default function Saved() {
    const { currentUser } = useAuth();
    const { location } = useLocation();
    
    const [savedNotices, setSavedNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedDocIds, setSavedDocIds] = useState({});

    useEffect(() => {
        async function fetchSaved() {
            if (!currentUser) return;
            try {
                const qSaved = query(collection(db, 'savedPosts'), where('userId', '==', currentUser.uid));
                const savedSnapshot = await getDocs(qSaved);
                
                const postIds = [];
                const docIdMap = {};
                savedSnapshot.forEach(d => {
                    const data = d.data();
                    postIds.push(data.postId);
                    docIdMap[data.postId] = d.id;
                });
                
                setSavedDocIds(docIdMap);

                if (postIds.length > 0) {
                    const chunks = [];
                    for(let i=0; i<postIds.length; i+=30) {
                        chunks.push(postIds.slice(i, i+30));
                    }
                    
                    let allPosts = [];
                    for (const chunk of chunks) {
                        const qPosts = query(collection(db, 'posts'), where('__name__', 'in', chunk));
                        const postSnap = await getDocs(qPosts);
                        postSnap.forEach(d => {
                            allPosts.push({ id: d.id, ...d.data() });
                        });
                    }

                    if (location) {
                        allPosts = allPosts.map(notice => {
                            const dist = calculateDistance(
                                location.latitude, location.longitude, 
                                notice.latitude, notice.longitude
                            );
                            return { ...notice, distance: dist };
                        });
                    }

                    setSavedNotices(allPosts);
                } else {
                    setSavedNotices([]);
                }
            } catch (error) {
                console.error("Error fetching saved posts:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchSaved();
    }, [currentUser, location]);

    const handleSaveToggle = async (postId) => {
        try {
            if (savedDocIds[postId]) {
                await deleteDoc(doc(db, 'savedPosts', savedDocIds[postId]));
                const newMap = { ...savedDocIds };
                delete newMap[postId];
                setSavedDocIds(newMap);
                setSavedNotices(savedNotices.filter(n => n.id !== postId));
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
        }
    };

    return (
        <div className="bg-white min-h-screen pb-6">
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <h1 className="text-xl font-bold text-primary">Saved Notices</h1>
                <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                    {savedNotices.length} Items
                </div>
            </div>

            <div className="px-6 pt-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : savedNotices.length > 0 ? (
                    savedNotices.map(notice => (
                        <NoticeCard 
                            key={notice.id} 
                            notice={notice} 
                            distance={notice.distance}
                            isSaved={!!savedDocIds[notice.id]}
                            onSaveToggle={handleSaveToggle}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookmarkMinus size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No saved notices yet</h3>
                        <p className="text-sm">Items you bookmark will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
