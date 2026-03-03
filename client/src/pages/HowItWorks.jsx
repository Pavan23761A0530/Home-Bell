import { ArrowRight, Search, Calendar, UserCheck, Star, Shield, Zap, Award, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const HowItWorks = () => {
    const steps = [
        {
            icon: Search,
            title: "1. Find a Service",
            desc: "Browse our wide range of household services, from cleaning to repairs. Enter your location to see available providers near you.",
            color: "text-primary-600",
            bg: "bg-primary-50"
        },
        {
            icon: Calendar,
            title: "2. Book & Schedule",
            desc: "Choose a time that works for you. Our smart system will match you with the best available professional in your area.",
            color: "text-secondary-600",
            bg: "bg-secondary-50"
        },
        {
            icon: UserCheck,
            title: "3. Service Delivery",
            desc: "A verified professional arrives at your doorstep equipped and ready to get the job done to your satisfaction.",
            color: "text-success-600",
            bg: "bg-success-50"
        },
        {
            icon: Star,
            title: "4. Rate & Pay",
            desc: "Payment is released only after the job is done. Rate your provider to help maintain our high-quality community standards.",
            color: "text-warning-600",
            bg: "bg-warning-50"
        }
    ];

    const features = [
        {
            icon: Shield,
            title: "Verified Professionals",
            desc: "Every provider undergoes background checks and skill verification before joining our platform."
        },
        {
            icon: Zap,
            title: "Instant Matching",
            desc: "Our AI-powered system finds the perfect provider for your needs in seconds."
        },
        {
            icon: Award,
            title: "Quality Guarantee",
            desc: "100% satisfaction guarantee with our money-back protection policy."
        },
        {
            icon: MapPin,
            title: "Real-time Tracking",
            desc: "Track your provider's location and estimated arrival time in real-time."
        },
        {
            icon: CreditCard,
            title: "Secure Payments",
            desc: "Pay safely through our platform with encrypted transactions and dispute resolution."
        },
        {
            icon: CheckCircle,
            title: "Post-Service Support",
            desc: "24/7 customer support and easy rebooking for any follow-up work."
        }
    ];

    const faqs = [
        {
            question: "How do you verify your service providers?",
            answer: "All providers undergo ID verification, background checks, and skill assessments. We also verify their business licenses and insurance."
        },
        {
            question: "What if I'm not satisfied with the service?",
            answer: "We offer a 100% satisfaction guarantee. Contact our support team within 48 hours and we'll either fix the issue or provide a full refund."
        },
        {
            question: "How are payments processed?",
            answer: "Payments are held securely until you confirm the job is completed to your satisfaction. We support all major payment methods."
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-secondary-600 py-20">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-white/20 text-white mb-8">
                        <Zap className="w-4 h-4 mr-2" />
                        Simple 4-Step Process
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        How LocalServe Works
                    </h1>
                    <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                        We've simplified the process of finding trusted help. Here's your path to a stress-free home service experience.
                    </p>
                </div>
            </div>

            {/* Steps Section */}
            <div className="max-w-6xl mx-auto px-4 py-20">
                <div className="relative">
                    <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-5/6 h-1 bg-gradient-to-r from-primary-200 via-secondary-200 to-success-200 rounded-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group text-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${step.bg} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <step.icon className={`w-10 h-10 ${step.color} group-hover:scale-110 transition-transform duration-300`} />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    {step.desc}
                                </p>
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white border-4 border-primary-200 rounded-full hidden lg:block"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-neutral-50 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                            Why Choose LocalServe?
                        </h2>
                        <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                            We go beyond just connecting you with service providers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h3>
                                <p className="text-neutral-600">{feature.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-neutral-600">Everything you need to know about our service</p>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <Card key={index} className="p-6">
                                <h3 className="text-lg font-bold text-neutral-900 mb-3">{faq.question}</h3>
                                <p className="text-neutral-600">{faq.answer}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to get started?</h2>
                    <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of satisfied customers and professionals on our platform
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register">
                            <Button size="lg" className="px-8 py-4 text-lg bg-white text-primary-600 hover:bg-neutral-100">
                                Find Help Now <ArrowRight size={20} className="ml-2" />
                            </Button>
                        </Link>
                        <Link to="/become-provider">
                            <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-white/10 text-white border-white/20 hover:bg-white/20">
                                Join as Professional
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
