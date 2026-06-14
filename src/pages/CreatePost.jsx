import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronDown, MapPin, ArrowRight, Navigation, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { geocode, fetchLocationSuggestions } from '../utils/geocode';
import { compressImage } from '../utils/image';

const CATEGORIES = ['Study', 'Jobs', 'Rentals', 'Events', 'Coaching', 'Buy & Sell', 'Lost & Found', 'Community'];

export default function CreatePost() {
    const { currentUser } = useAuth();
    const { location } = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    
    // Geocoding states
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        locationName: '',
        contactMethod: 'WhatsApp',
        contactNumber: '',
        price: ''
    });

    // Image states
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Only JPG, PNG and WebP images are allowed');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);

            const compressed = await compressImage(file, 2);
            setImageFile(compressed);
        } catch (error) {
            console.error('Compression error:', error);
            toast.error('Failed to process image');
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setUploadProgress(0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (e) => {
        setFormData({ ...formData, locationName: e.target.value });
        setSelectedLocation(null);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (formData.locationName.length >= 3 && !selectedLocation) {
                const results = await fetchLocationSuggestions(formData.locationName);
                setSuggestions(results);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.locationName, selectedLocation]);

    const handleSelectSuggestion = (suggestion) => {
        setFormData({ ...formData, locationName: suggestion.displayName });
        setSelectedLocation({
            latitude: suggestion.latitude,
            longitude: suggestion.longitude
        });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleUseCurrentLocation = () => {
        if (!location) {
            toast.error("Location not available. Please allow location access.");
            return;
        }
        setFormData({ ...formData, locationName: "Current Location" });
        setSelectedLocation({
            latitude: location.latitude,
            longitude: location.longitude
        });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const getExpirationDays = (category) => {
        switch(category) {
            case 'Rentals': return 30;
            case 'Jobs': return 45;
            case 'Lost & Found': return 60;
            case 'Events': return 14; 
            default: return 30;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        
        if (formData.contactNumber.replace(/\D/g, '').length < 10) {
            toast.error('Contact number must be at least 10 digits');
            return;
        }
        
        setLoading(true);
        setUploadProgress(0);

        try {
            let uploadedImageUrl = null;

            if (imageFile) {
                uploadedImageUrl = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const fd = new FormData();
                    fd.append('file', imageFile);
                    fd.append('upload_preset', 'noticeboard_upload');

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            setUploadProgress(percent);
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response.secure_url);
                        } else {
                            reject(new Error('Image upload failed'));
                        }
                    };

                    xhr.onerror = () => reject(new Error('Network error during upload'));

                    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dpxkefj5e/image/upload', true);
                    xhr.send(fd);
                });
            }

            let finalLat = null;
            let finalLon = null;
            let finalName = formData.locationName;

            if (selectedLocation) {
                finalLat = selectedLocation.latitude;
                finalLon = selectedLocation.longitude;
            } else {
                const geo = await geocode(formData.locationName);
                if (!geo) {
                    toast.error('Could not find this location. Please be more specific or select from suggestions.');
                    setLoading(false);
                    return;
                }
                finalLat = geo.latitude;
                finalLon = geo.longitude;
                finalName = geo.displayName;
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + getExpirationDays(formData.category));

            await addDoc(collection(db, 'posts'), {
                ...formData,
                locationName: finalName,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'User',
                latitude: finalLat,
                longitude: finalLon,
                imageUrl: uploadedImageUrl,
                createdAt: serverTimestamp(),
                expiresAt,
                views: 0,
                savedCount: 0
            });

            toast.success('Notice posted successfully!');
            navigate('/');
        } catch (error) {
            console.error("Error creating post:", error);
            toast.error('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-6">
            <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-6 py-4 flex items-center justify-between">
                <button type="button" onClick={() => navigate(-1)} className="text-gray-500">
                    ←
                </button>
                <h1 className="text-xl font-bold text-primary">Create Notice</h1>
                <div className="w-6"></div> {/* Spacer for centering */}
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 flex flex-col gap-6">

                {/* Title */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Title</label>
                    <input 
                        type="text" 
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        placeholder="What are you posting about?"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Category</label>
                    <div className="relative">
                        <select 
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 appearance-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            <option value="" disabled>Select Category</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Description</label>
                    <textarea 
                        name="description"
                        required
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                        placeholder="Describe your notice in detail..."
                    ></textarea>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Photo <span className="text-gray-400 font-normal text-sm">(Optional)</span></label>
                    {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-48">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                            <button 
                                type="button" 
                                onClick={removeImage}
                                disabled={uploadProgress > 0 && uploadProgress < 100}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors disabled:opacity-50"
                            >
                                <X size={16} />
                            </button>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-6">
                                    <div className="w-full max-w-xs bg-white/30 rounded-full h-3 overflow-hidden mb-2 shadow-inner">
                                        <div className="bg-primary h-full rounded-full transition-all duration-300 shadow-md" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <span className="text-white font-bold text-sm tracking-wider">UPLOADING {uploadProgress}%</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer group">
                            <input 
                                type="file" 
                                accept="image/jpeg, image/jpg, image/png, image/webp"
                                onChange={handleImageSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <ImageIcon size={24} />
                            </div>
                            <span className="font-medium text-sm text-gray-700">Tap to upload photo</span>
                            <span className="text-xs mt-1 text-gray-400">JPG, PNG, WebP (Max 5MB)</span>
                        </div>
                    )}
                </div>

                {/* Location */}
                <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block font-semibold text-gray-900">Neighborhood / Area</label>
                        <button 
                            type="button" 
                            onClick={handleUseCurrentLocation}
                            className="text-xs font-semibold text-primary flex items-center gap-1 hover:text-primary-dark"
                        >
                            <Navigation size={12} /> Use Current
                        </button>
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            name="locationName"
                            required
                            value={formData.locationName}
                            onChange={handleLocationChange}
                            onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="e.g. Indiranagar, Bangalore"
                            autoComplete="off"
                        />
                    </div>
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate flex items-center"
                                >
                                    <MapPin size={14} className="mr-2 text-gray-400 min-w-[14px]" />
                                    <span className="truncate">{s.displayName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contact Type & Number */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Contact Details</label>
                    <div className="flex gap-2 mb-3">
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, contactMethod: 'WhatsApp' })}
                            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                                formData.contactMethod === 'WhatsApp' ? 'bg-blue-100 text-primary border border-blue-200' : 'bg-white border border-gray-200 text-gray-600'
                            }`}
                        >
                            WhatsApp
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, contactMethod: 'Call' })}
                            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                                formData.contactMethod === 'Call' ? 'bg-blue-100 text-primary border border-blue-200' : 'bg-white border border-gray-200 text-gray-600'
                            }`}
                        >
                            Call
                        </button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
                        <input 
                            type="tel" 
                            name="contactNumber"
                            required
                            minLength={10}
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="e.g. 9876543210"
                        />
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="block font-semibold text-gray-900 mb-2">Price <span className="text-gray-400 font-normal text-sm">(Optional)</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input 
                            type="number" 
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="e.g. 500"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white rounded-xl py-4 font-bold mt-4 mb-8 hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                >
                    {loading ? 'Posting...' : (
                        <>
                            Preview & Post <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
