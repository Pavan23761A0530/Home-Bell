import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, Star, Shield, ArrowRight, X } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';
import cleaningImage from '../assets/cleaning.jpg';
import plumbingImage from '../assets/plumbing.webp';
import electricianImage from '../assets/electician.jpeg';
import movingImage from '../assets/moving.webp';
import paintingImage from '../assets/painting.webp';
import applianceImage from '../assets/repairing.jpg';
import gardeningImage from '../assets/gardeining.webp';

const Services = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');

    const categories = ['All', 'Cleaning', 'Plumbing', 'Electrician', 'Moving', 'Painting', 'Appliance', 'Gardening'];

    const categoryImages = {
        Cleaning: cleaningImage,
        Plumbing: plumbingImage,
        Electrician: electricianImage,
        Moving: movingImage,
        Painting: paintingImage,
        Appliance: applianceImage,
        Gardening: gardeningImage
    };

    useEffect(() => {
        // Sync state with URL params
        const q = searchParams.get('search');
        const c = searchParams.get('category');
        if (q !== null) setSearchTerm(q);
        if (c !== null) setSelectedCategory(c);

        fetchServices();
    }, [searchParams]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            // Use provider services to show provider-assigned pricing
            const res = await api.get('/services/provider-services');
            if (res.data && res.data.success) {
                const offerings = res.data.data || [];
                const byService = new Map();
                for (const o of offerings) {
                    const s = o.service;
                    if (!s) continue;
                    const key = String(s._id);
                    const current = byService.get(key);
                    const price = Number(o.providerPrice);
                    if (!current || price < current.price) {
                        byService.set(key, {
                            _id: s._id,
                            name: s.name,
                            description: s.description,
                            category: s.category,
                            price
                        });
                    }
                }
                setServices(Array.from(byService.values()));
            } else {
                setServices([]);
            }
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ search: searchTerm, category: selectedCategory });
    };

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setSearchParams({ search: searchTerm, category: cat });
    };

    const getCategoryName = (service) => {
        return typeof service.category === 'string' ? service.category : service.category?.name;
    };

    const getServiceImage = (service) => {
        const categoryName = getCategoryName(service);
        return categoryImages[categoryName] || cleaningImage;
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase());

        // Handle category being a string (mock) or object (populated from backend)
        const categoryName = getCategoryName(s);

        const matchesCategory = selectedCategory === 'All' ||
            categoryName?.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header / Filter Section */}
            <div className="bg-white border-b border-neutral-200 sticky top-16 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-auto">
                            <h1 className="text-2xl font-bold text-neutral-900">Find a Professional</h1>
                            <p className="text-neutral-500 text-sm">Explore {filteredServices.length} services available near you</p>
                        </div>

                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Input
                                placeholder="Search services..."
                                icon={Search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-12"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setSearchParams({ category: selectedCategory }); }}
                                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </form>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-neutral-900 text-white shadow-md'
                                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <Link key={service._id} to={`/book/${service._id}`} state={{ service }} className="group h-full">
                                    <Card className="h-full flex flex-col p-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary-100">
                                        <div className="h-48 bg-neutral-100 relative overflow-hidden flex items-center justify-center">
                                            <img
                                                src={getServiceImage(service)}
                                                alt={service.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-neutral-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
                                                {service.rating} ({service.reviews})
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                        </div>

                                        <div className="p-6 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="neutral" className="mb-2">
                                                    {typeof service.category === 'string' ? service.category : service.category?.name}
                                                </Badge>
                                            </div>

                                            <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                                                {service.name}
                                            </h3>

                                            <p className="text-neutral-500 text-sm mb-6 line-clamp-2 flex-grow">
                                                {service.description}
                                            </p>

                                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-auto">
                                                <div><p className="text-xl font-bold text-neutral-900">₹{Number(service.price).toFixed(2)}</p></div>
                                                <Button size="sm" className="gap-1 rounded-full px-4 group-hover:bg-primary-700">
                                                    Book Now <ArrowRight size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="h-10 w-10 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">Service Not Available</h3>
                                <p className="text-neutral-500 max-w-md mx-auto mb-8">
                                    Sorry, we couldn't find any services matching "{searchTerm}" at the moment. Please try a different category or keyword.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSearchParams({}); }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;
