import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Star, ThumbsUp, MessageSquare, User, CheckCircle, Clock } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';

const RateProvider = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const booking = location.state?.booking || {};
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [reviewOptions, setReviewOptions] = useState({
        punctual: false,
        professional: false,
        quality: false,
        wouldRecommend: false
    });

    const handleOptionChange = (option) => {
        setReviewOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/reviews', {
                bookingId: booking._id,
                providerId: booking.provider?._id,
                rating,
                review,
                reviewOptions
            });

            if (res.data.success) {
                toast.success('Thank you for your review!');
                setTimeout(() => {
                    navigate(`/bookings/${booking._id}`);
                }, 1500);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-10 h-10 text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Service</h1>
                    <p className="text-gray-600">Share your experience to help other customers</p>
                </div>

                <Card className="p-6">
                    {/* Booking Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Service Details</h3>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                Completed
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Service:</p>
                                <p className="font-medium">{booking.service?.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Provider:</p>
                                <p className="font-medium">{booking.provider?.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Date:</p>
                                <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Duration:</p>
                                <p className="font-medium">2 hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Rating Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Star className="mr-2" size={20} fill="currentColor" />
                            How was your experience?
                        </h3>
                        
                        <div className="flex justify-center space-x-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    className={`p-2 rounded-full transition-all ${
                                        star <= (hover || rating) 
                                            ? 'text-yellow-400 scale-125' 
                                            : 'text-gray-300 hover:text-yellow-300'
                                    }`}
                                >
                                    <Star 
                                        size={40} 
                                        fill={star <= (hover || rating) ? "currentColor" : "none"} 
                                        stroke={star <= (hover || rating) ? "currentColor" : "currentColor"}
                                    />
                                </button>
                            ))}
                        </div>
                        
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-900">
                                {rating > 0 && (
                                    <>
                                        {rating} {rating === 1 ? 'Star' : 'Stars'}
                                        <span className="block text-sm text-gray-600 mt-1">
                                            {rating === 1 && 'Poor'}
                                            {rating === 2 && 'Fair'}
                                            {rating === 3 && 'Good'}
                                            {rating === 4 && 'Very Good'}
                                            {rating === 5 && 'Excellent'}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Quick Feedback Options */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Feedback</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleOptionChange('punctual')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    reviewOptions.punctual
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <ThumbsUp className="mr-3" size={20} />
                                    <span className="font-medium">Was punctual</span>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleOptionChange('professional')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    reviewOptions.professional
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <User className="mr-3" size={20} />
                                    <span className="font-medium">Professional</span>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleOptionChange('quality')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    reviewOptions.quality
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <CheckCircle className="mr-3" size={20} />
                                    <span className="font-medium">Great quality</span>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleOptionChange('wouldRecommend')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    reviewOptions.wouldRecommend
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <ThumbsUp className="mr-3" size={20} />
                                    <span className="font-medium">Would recommend</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Detailed Review */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <MessageSquare className="mr-2" size={20} />
                            Share Details (Optional)
                        </h3>
                        
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Tell others about your experience with this provider..."
                            rows={5}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(`/bookings/${booking._id}`)}
                        >
                            Skip Review
                        </Button>
                        <Button
                            onClick={handleSubmitReview}
                            isLoading={loading}
                            disabled={rating === 0}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                            Submit Review
                        </Button>
                    </div>
                </Card>

                {/* Tips for Great Reviews */}
                <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="mr-2" size={18} />
                        Tips for helpful reviews
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Be specific about what you liked or didn't like</li>
                        <li>• Mention the provider's professionalism and quality of work</li>
                        <li>• Include details about their punctuality and communication</li>
                        <li>• Share if they went above and beyond expectations</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RateProvider;