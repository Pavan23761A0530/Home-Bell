import { Link } from 'react-router-dom';
import { CheckCircle, DollarSign, Clock, Users, Shield, Award, TrendingUp, MapPin, Smartphone, Star } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const BecomeProvider = () => {
    const benefits = [
        {
            icon: DollarSign,
            title: "Earn More",
            desc: "Set your own rates or accept fixed price jobs. Get paid instantly through our secure payment system.",
            color: "text-success-600",
            bg: "bg-success-50"
        },
        {
            icon: Clock,
            title: "Flexible Hours",
            desc: "Work when you want. Toggle your availability with one click and manage your own schedule.",
            color: "text-primary-600",
            bg: "bg-primary-50"
        },
        {
            icon: Users,
            title: "Zero Marketing",
            desc: "We send customers directly to you based on your location and skills. Focus on doing great work.",
            color: "text-info-600",
            bg: "bg-info-50"
        },
        {
            icon: Shield,
            title: "Secure Platform",
            desc: "Enjoy peace of mind with our verified customer system and dispute resolution support.",
            color: "text-warning-600",
            bg: "bg-warning-50"
        },
        {
            icon: Award,
            title: "Build Your Reputation",
            desc: "Grow your ratings and reviews to attract more customers and command higher prices.",
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            icon: TrendingUp,
            title: "Business Growth",
            desc: "Access tools and insights to help grow your service business and increase earnings.",
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ];

    const steps = [
        {
            number: "1",
            title: "Create Account",
            desc: "Sign up as a service provider in less than 5 minutes. Provide your basic information and service details.",
            icon: Users
        },
        {
            number: "2",
            title: "Get Verified",
            desc: "Upload your documents and credentials. Our team will verify your qualifications within 24-48 hours.",
            icon: Shield
        },
        {
            number: "3",
            title: "Start Earning",
            desc: "Set your availability and start receiving job notifications. Accept jobs that match your expertise.",
            icon: DollarSign
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-primary-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-primary-100 text-primary-800 mb-8">
                        <Star className="w-4 h-4 mr-2 text-primary-600" />
                        Join 500+ Verified Professionals
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Turn Your Skills Into
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                            Steady Income
                        </span>
                    </h1>
                    
                    <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-10">
                        Join thousands of professionals growing their business with LocalServe. 
                        Get more customers, better rates, and complete flexibility.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register?role=provider">
                            <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-secondary-600 hover:bg-secondary-700">
                                Start Earning Today
                            </Button>
                        </Link>
                        <Link to="/how-it-works">
                            <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-white/10 text-white border-white/20 hover:bg-white/20">
                                How It Works
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                            Why Professionals Love LocalServe
                        </h2>
                        <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                            Everything you need to build a successful service business
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <Card key={index} className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-2xl ${benefit.bg} flex items-center justify-center mb-6`}>
                                    <benefit.icon className={`w-7 h-7 ${benefit.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">{benefit.title}</h3>
                                <p className="text-neutral-600">{benefit.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                            Get Started in 3 Simple Steps
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Join our network of trusted professionals
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg mr-4">
                                            {step.number}
                                        </div>
                                        <step.icon className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
                                    <p className="text-neutral-600">{step.desc}</p>
                                </div>
                                
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary-300">
                                        <ChevronRight size={24} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/register?role=provider">
                            <Button size="lg" className="px-10 py-4 text-lg">
                                Become a Provider Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '500+', label: 'Active Providers' },
                            { number: '25K+', label: 'Jobs Completed' },
                            { number: '4.8★', label: 'Average Rating' },
                            { number: '₹25L+', label: 'Total Earned' }
                        ].map((stat, index) => (
                            <div key={index}>
                                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                                <div className="text-primary-100">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BenefitCard = ({ icon, title, desc }) => (
    <div className="text-center p-6 border rounded-lg hover:shadow-lg transition">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{desc}</p>
    </div>
);

export default BecomeProvider;
