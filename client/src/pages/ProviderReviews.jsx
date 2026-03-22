import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Star, Calendar, User } from 'lucide-react';

const ProviderReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Since this is a provider dashboard page, we'll fetch the provider's own reviews
      const profileRes = await api.get('/providers/me');
      if (profileRes.data.success) {
        const providerId = profileRes.data.data._id;
        const reviewsRes = await api.get(`/reviews/provider/${providerId}`);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data);
          calculateStats(reviewsRes.data.data);
        }
      }
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsList) => {
    if (reviewsList.length === 0) {
      setAverageRating(0);
      setRatingCounts({});
      return;
    }

    // Calculate average rating
    const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviewsList.length;
    setAverageRating(avgRating);

    // Count ratings by star
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach(review => {
      counts[review.rating]++;
    });
    setRatingCounts(counts);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}
      />
    ));
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
        <p className="text-gray-600">See what customers are saying about your services.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
          <div className="flex justify-center mt-2">
            {renderStars(Math.round(averageRating))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-gray-900">{reviews.length}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-gray-900">
            {ratingCounts[5] ? Math.round((ratingCounts[5] / reviews.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">5-Star Reviews</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-gray-900">
            {reviews.length > 0 ? new Date(Math.max(...reviews.map(r => new Date(r.createdAt).getTime()))).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Latest Review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rating Distribution</h2>
          
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center">
                <div className="w-10 text-sm font-medium text-gray-900">{star}★</div>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ 
                        width: reviews.length > 0 
                          ? `${(ratingCounts[star] / reviews.length) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-10 text-right text-sm text-gray-600">{ratingCounts[star] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Reviews</h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            <User size={16} className="text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {review.customer?.name || 'Anonymous Customer'}
                            </span>
                          </div>
                          <div className="ml-4 flex items-center">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-600">{review.rating}.0</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No reviews yet. Once you complete jobs, customers will be able to leave reviews here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderReviews;