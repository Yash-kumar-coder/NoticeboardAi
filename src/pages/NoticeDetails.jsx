import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { MapPin, Clock, Bookmark, Phone, MessageCircle, AlertTriangle, Eye } from 'lucide-react';
import { formatRelativeTime } from '../utils/date';
import { useLocation } from '../contexts/LocationContext';
import { calculateDistance, formatDistance } from '../utils/distance';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function NoticeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { location } = useLocation();
    const { currentUser } = useAuth();
    
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState(null);

    const [isSaved, setIsSaved] = useState(false);
    const [savedDocId, setSavedDocId] = useState(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const hasViewed = useRef(false);

    useEffect(() => {
        async function fetchNotice() {
            try {
                const docRef = doc(db, 'posts', id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNotice({ id: docSnap.id, ...data });
                    
                    // Check if saved
                    if (currentUser) {
                        const qSaved = query(collection(db, 'savedPosts'), where('userId', '==', currentUser.uid), where('postId', '==', id));
                        const savedSnapshot = await getDocs(qSaved);
                        if (!savedSnapshot.empty) {
                            setIsSaved(true);
                            setSavedDocId(savedSnapshot.docs[0].id);
                        }
                    }
                    
                    // Increment views safely once
                    if (!hasViewed.current) {
                        hasViewed.current = true;
                        // Don't increment if the creator is viewing their own post
                        if (!currentUser || currentUser.uid !== data.userId) {
                            await updateDoc(docRef, { views: increment(1) });
                        }
                    }
                    
                    if (location && data.latitude && data.longitude) {
                        setDistance(calculateDistance(location.latitude, location.longitude, data.latitude, data.longitude));
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching notice:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchNotice();
    }, [id, location, currentUser]);

    const handleSaveToggle = async () => {
        if (!currentUser) {
            toast.error("Please login to save notices.");
            navigate('/login');
            return;
        }

        try {
            if (isSaved && savedDocId) {
                await deleteDoc(doc(db, 'savedPosts', savedDocId));
                setIsSaved(false);
                setSavedDocId(null);
                toast.success("Removed from saved posts");
            } else {
                const docRef = await addDoc(collection(db, 'savedPosts'), {
                    userId: currentUser.uid,
                    postId: id,
                    createdAt: serverTimestamp()
                });
                setIsSaved(true);
                setSavedDocId(docRef.id);
                toast.success("Saved to your posts");
            }
        } catch (error) {
            console.error("Error toggling save:", error);
            toast.error("Failed to update saved posts");
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
    }

    if (!notice) {
        return <div className="p-6 text-center text-gray-500 mt-20">Notice not found.</div>;
    }

    const handleWhatsApp = () => {
        const url = `https://wa.me/91${notice.contactNumber}?text=Hi, I saw your listing for "${notice.title}" on NoticeBoard AI.`;
        window.open(url, '_blank');
    };

    const handleCall = () => {
        window.open(`tel:${notice.contactNumber}`);
    };

    const handleReport = async () => {
        if (!reportReason) {
            toast.error('Please select a reason');
            return;
        }
        
        try {
            await addDoc(collection(db, 'reports'), {
                postId: notice.id,
                reportedBy: currentUser.uid,
                reason: reportReason,
                createdAt: serverTimestamp()
            });
            toast.success('Report submitted successfully. We will review it shortly.');
            setShowReportModal(false);
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error('Failed to submit report.');
        }
    };

    return (
        <div className="bg-white min-h-screen pb-24">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-colors">
                    ← Back
                </button>
            </div>

            <div className="px-6 pt-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight pr-4">
                        {notice.title}
                    </h1>
                    <button 
                        onClick={handleSaveToggle}
                        className={`mt-1 p-2 -mr-2 rounded-full transition-colors hover:bg-gray-50 ${isSaved ? "text-primary" : "text-gray-400"}`}
                    >
                        <Bookmark size={24} className={isSaved ? "fill-primary" : ""} />
                    </button>
                </div>
                
                <div className="flex items-center gap-3 mt-3 mb-4">
                    <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-md">
                        • {notice.category}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} /> {formatRelativeTime(notice.createdAt)}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1 ml-auto">
                        <Eye size={14} /> {notice.views || 0} views
                    </span>
                </div>

                <div className="text-3xl font-bold text-primary mb-4">
                    {notice.price ? `₹ ${notice.price}` : 'Free'}
                </div>

                <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{notice.locationName}</span>
                    {distance !== null && <span className="text-gray-400">({formatDistance(distance)})</span>}
                </div>
            </div>

            {notice.imageUrl && (
                <div className="px-6 pt-2 pb-6 border-b border-gray-100">
                    <div className="w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <img src={notice.imageUrl} alt="Notice" className="w-full h-auto object-contain max-h-[60vh]" />
                    </div>
                </div>
            )}

            <div className="px-6 py-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {notice.description}
                </p>
            </div>

            <div className="px-6 py-6 flex justify-between items-center text-sm text-gray-500">
                <div>Posted by <span className="font-semibold text-gray-900">{notice.userName}</span></div>
                <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1 text-red-500 hover:underline">
                    <AlertTriangle size={14} /> Report
                </button>
            </div>

            <div className="px-6 py-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Contact Publisher</h3>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCall}
                        className="flex-1 bg-white border border-gray-200 text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Phone size={18} /> Call
                    </button>
                    <button 
                        onClick={handleWhatsApp}
                        className="flex-[2] bg-primary text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                    >
                        <MessageCircle size={18} /> WhatsApp
                    </button>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Report Notice</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4 flex flex-col gap-2">
                            <p className="text-sm text-gray-600 mb-2">Why are you reporting this notice?</p>
                            {['Spam', 'Scam', 'Incorrect Information', 'Offensive Content'].map(reason => (
                                <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="reportReason" 
                                        value={reason} 
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{reason}</span>
                                </label>
                            ))}
                            <button 
                                onClick={handleReport}
                                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl mt-4 hover:bg-red-600 transition-colors"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
