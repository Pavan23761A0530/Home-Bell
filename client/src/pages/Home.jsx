import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, Zap, Star, CheckCircle, ArrowRight, MapPin, Clock, Users, Award, TrendingUp, Play, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useState } from 'react';

const Home = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/services?search=${searchQuery}`);
    };

    const categories = [
        { name: 'Cleaning', icon: '🧹', count: '120+ Pros', slug: 'cleaning', description: 'Deep cleaning, move-in/out, office cleaning' },
        { name: 'Plumbing', icon: '🔧', count: '85+ Pros', slug: 'plumbing', description: 'Leak repair, installation, maintenance' },
        { name: 'Electrician', icon: '⚡', count: '90+ Pros', slug: 'electrician', description: 'Wiring, repairs, installations' },
        { name: 'Moving', icon: '📦', count: '50+ Pros', slug: 'moving', description: 'Local moves, packing, storage' },
        { name: 'Painting', icon: '🎨', count: '40+ Pros', slug: 'painting', description: 'Interior, exterior, decorative painting' },
        { name: 'Appliance', icon: '⚙️', count: '65+ Pros', slug: 'appliance', description: 'Repair, installation, maintenance' },
    ];

    const features = [
        {
            title: 'Verified Professionals',
            desc: 'Every provider undergoes background checks and skill verification',
            icon: Shield,
            color: 'text-success-600',
            bg: 'bg-success-50'
        },
        {
            title: 'Real-time Tracking',
            desc: 'Track your service provider location and arrival time',
            icon: MapPin,
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            title: 'Secure Payments',
            desc: 'Pay safely through our platform with money-back guarantee',
            icon: Award,
            color: 'text-warning-600',
            bg: 'bg-warning-50'
        },
        {
            title: '24/7 Support',
            desc: 'Round-the-clock customer service for all your concerns',
            icon: Clock,
            color: 'text-info-600',
            bg: 'bg-info-50'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Homeowner',
            content: 'Found an amazing electrician within 30 minutes. Professional, punctual, and reasonably priced!',
            rating: 5,
            avatar: 'SJ'
        },
        {
            name: 'Michael Chen',
            role: 'Property Manager',
            content: 'Using LocalServe for all our maintenance needs. The quality and reliability are exceptional.',
            rating: 5,
            avatar: 'MC'
        },
        {
            name: 'Priya Sharma',
            role: 'Small Business Owner',
            content: 'The cleaning service transformed our office space. Will definitely use again!',
            rating: 5,
            avatar: 'PS'
        }
    ];

    return (
        <div className="space-y-24 pb-20 relative" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-transparent pt-16 pb-32 lg:pt-24 lg:pb-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary-50 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 ring-1 ring-inset ring-primary-600/10 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
                        New: AI-Powered Smart Matching
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-neutral-900 mb-6">
                        Expert help, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                            instantly available.
                        </span>
                    </h1>

                    <p className="text-xl text-neutral-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Connect with top-rated local professionals for cleaning, repair, and home improvement.
                        Trusted by over 10,000 homeowners.
                    </p>

                    <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-card ring-1 ring-neutral-200/50 flex flex-col sm:flex-row gap-2">
                        <div className="flex-grow z-0">
                            <Input
                                placeholder="What service do you need?"
                                className="border-0 shadow-none focus:ring-0 text-lg py-3 pr-4 z-0 placeholder:text-neutral-400"
                                icon={Search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="rounded-xl px-8 shadow-lg shadow-primary-500/20"
                            onClick={handleSearch}
                        >
                            Find Pros
                        </Button>
                    </div>

                    <div className="mt-10 flex items-center justify-center space-x-8 text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-success-500" />
                            <span className="text-sm font-medium">Verified Pros</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-success-500" />
                            <span className="text-sm font-medium">Insured Work</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-success-500" />
                            <span className="text-sm font-medium">Secure Payment</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="bg-neutral-50/50 backdrop-blur-sm py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Popular Services</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto">
                            From quick repairs to full home renovations, we have experts for every job.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((cat) => (
                            <Link key={cat.slug} to={`/services?category=${cat.slug}`}>
                                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-left group cursor-pointer border-transparent hover:border-primary-200 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl flex-shrink-0">{cat.icon}</div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors text-lg">{cat.name}</h3>
                                            <p className="text-sm text-neutral-600 mt-1">{cat.description}</p>
                                            <p className="text-xs text-primary-600 font-medium mt-2">{cat.count}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/services">
                            <Button size="lg" className="gap-2 px-8">
                                View all services <ArrowRight size={18} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-6">Why Choose LocalServe?</h2>
                        <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                            We're revolutionizing home services with technology, trust, and transparency.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow duration-300 group">
                                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-4">{feature.title}</h3>
                                <p className="text-neutral-600">{feature.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-gradient-to-br from-primary-50/50 to-indigo-50/50 backdrop-blur-sm py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Trusted by Thousands</h2>
                        <p className="text-neutral-600">Hear what our customers have to say about their experience</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="p-8 relative">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg mr-4">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-900">{testimonial.name}</h4>
                                        <p className="text-sm text-neutral-500">{testimonial.role}</p>
                                    </div>
                                </div>

                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>

                                <p className="text-neutral-700 italic">"{testimonial.content}"</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '10K+', label: 'Happy Customers' },
                            { number: '500+', label: 'Verified Pros' },
                            { number: '25K+', label: 'Services Completed' },
                            { number: '4.9', label: 'Average Rating' }
                        ].map((stat, index) => (
                            <div key={index} className="text-white">
                                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                                <div className="text-neutral-300">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl font-bold text-neutral-900 leading-tight">
                            Why choose <span className="text-primary-600">LocalServe</span>?
                        </h2>
                        <p className="text-lg text-neutral-500">
                            We're not just a directory. We're a full-service platform that ensures your job gets done right, on time, and within budget.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: 'Smart AI Matching', desc: 'Get matched with the perfect pro in seconds based on your specific needs.', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                                { title: 'Verified Professionals', desc: 'Every registered provider undergoes a rigid 5-step background check.', icon: Shield, color: 'text-success-500', bg: 'bg-success-50' },
                                { title: 'Transparent Pricing', desc: 'See fixed prices upfront or get detailed quotes. No hidden fees.', icon: MapPin, color: 'text-primary-600', bg: 'bg-primary-50' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900 text-lg">{item.title}</h3>
                                        <p className="text-neutral-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-3xl transform rotate-3 opacity-10"></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-neutral-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-sm text-neutral-400 uppercase tracking-wider font-semibold">Live Activity</p>
                                    <h3 className="text-xl font-bold text-neutral-900">Recent Bookings</h3>
                                </div>
                                <div className="animate-pulse w-3 h-3 bg-success-500 rounded-full"></div>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { service: 'Deep Cleaning', loc: 'Downtown', time: '2 mins ago', price: 'Verified' },
                                    { service: 'AC Repair', loc: 'Westside', time: '5 mins ago', price: 'Verified' },
                                    { service: 'Plumbing Fix', loc: 'North Hills', time: '12 mins ago', price: 'Verified' },
                                ].map((booking, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg">
                                                {i === 0 ? '🧹' : i === 1 ? '❄️' : '🔧'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-900">{booking.service}</p>
                                                <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                    <MapPin size={10} /> {booking.loc}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary-600">{booking.price}</p>
                                            <p className="text-xs text-neutral-400 flex items-center justify-end gap-1">
                                                <Clock size={10} /> {booking.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="mx-4 sm:mx-8 mb-12">
                <div className="max-w-7xl mx-auto bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

                    <div className="relative z-10 px-8 py-20 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to transform your home?</h2>
                        <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
                            Join thousands of homeowners and professionals on the most trusted service marketplace.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="rounded-full px-10 text-lg w-full sm:w-auto">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="/become-provider">
                                <Button size="lg" variant="secondary" className="rounded-full px-10 text-lg w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
                                    Become a Pro
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
