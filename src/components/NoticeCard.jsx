import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Bookmark, Phone, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '../utils/date';
import { formatDistance } from '../utils/distance';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NoticeCard({ notice, distance, isSaved, onSaveToggle }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4 p-5 relative">
            <div className="flex justify-between items-start mb-3">
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {notice.category}
                </span>
                <button 
                    onClick={(e) => { e.preventDefault(); onSaveToggle(notice.id); }}
                    className="p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                    <Bookmark size={18} className={isSaved ? "fill-primary text-primary" : "text-gray-400"} />
                </button>
            </div>
            
            <Link to={`/notice/${notice.id}`} className="block">
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 leading-tight line-clamp-2">
                            {notice.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-2 line-clamp-1">
                            {notice.locationName}
                        </p>
                        <p className="text-gray-600 text-sm line-clamp-2">
                            {notice.description}
                        </p>
                    </div>
                    {notice.imageUrl && (
                        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <img src={notice.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </Link>
            
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
                <div className="font-bold text-gray-900 text-lg">
                    {notice.price ? `₹${notice.price}` : 'Free'}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!currentUser) {
                                toast.error("Please login to contact the publisher.");
                                navigate('/login');
                                return;
                            }
                            window.open(`tel:${notice.contactNumber}`);
                        }} 
                        className="bg-gray-100 text-gray-700 p-2 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <Phone size={18} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!currentUser) {
                                toast.error("Please login to contact the publisher.");
                                navigate('/login');
                                return;
                            }
                            window.open(`https://wa.me/91${notice.contactNumber}?text=Hi, I saw your listing for "${notice.title}" on NoticeBoard AI.`, '_blank');
                        }} 
                        className="bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 flex items-center gap-1.5"
                    >
                        <MessageCircle size={18} /> WhatsApp
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-600">{distance != null ? formatDistance(distance) : "Location unavailable"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span>{formatRelativeTime(notice.createdAt)}</span>
                </div>
            </div>
        </div>
    );
}
