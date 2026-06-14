import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import NoticeCard from '../components/NoticeCard';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MyPosts() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyPosts() {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'posts'), where('userId', '==', currentUser.uid));
                const snap = await getDocs(q);
                
                const fetched = [];
                snap.forEach(d => {
                    fetched.push({ id: d.id, ...d.data() });
                });
                
                // Sort client side by created At
                fetched.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
                
                setPosts(fetched);
            } catch (error) {
                console.error("Error fetching my posts:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchMyPosts();
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notice?")) return;
        
        try {
            await deleteDoc(doc(db, 'posts', id));
            setPosts(posts.filter(p => p.id !== id));
            toast.success("Notice deleted successfully");
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-6">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
                <h1 className="text-xl font-bold">My Posts</h1>
                <div className="w-6"></div>
            </div>

            <div className="px-6 pt-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="relative">
                            <NoticeCard 
                                notice={post} 
                                distance={null}
                                isSaved={false}
                                onSaveToggle={() => {}}
                            />
                            <button 
                                onClick={(e) => { e.preventDefault(); handleDelete(post.id); }}
                                className="absolute top-3 right-12 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                        <p>You haven't created any notices.</p>
                        <button onClick={() => navigate('/post')} className="mt-4 text-primary font-bold">
                            Create one now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
