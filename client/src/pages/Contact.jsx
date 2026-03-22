import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const Contact = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ firstName: '', lastName: '', email: '', message: '' });
        }, 3000);
    };

    const supportOptions = [
        {
            title: 'General Inquiries',
            desc: 'Questions about our services and platform',
            icon: MessageCircle,
            response: '24 hours'
        },
        {
            title: 'Technical Support',
            desc: 'Issues with the website or app',
            icon: Clock,
            response: '2 hours'
        },
        {
            title: 'Provider Support',
            desc: 'Help with your provider account',
            icon: CheckCircle,
            response: '12 hours'
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">Get in Touch</h1>
                    <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                        Have questions or need help? Our team is here to support you every step of the way.
                    </p>
                </div>

                {/* Support Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
                    {supportOptions.map((option, index) => (
                        <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                                <option.icon className="w-6 h-6 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 mb-2">{option.title}</h3>
                            <p className="text-neutral-600 text-sm mb-4">{option.desc}</p>
                            <div className="inline-flex items-center text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                                <Clock size={12} className="mr-1" />
                                Response: {option.response}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Contact Information</h2>
                        <p className="text-neutral-600 mb-8">
                            Reach out to us through any of these channels. We typically respond within 24 hours.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-neutral-100">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                    <Phone className="text-primary-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-900">Phone Support</p>
                                    <p className="text-neutral-600">+91 98765 43210</p>
                                    <p className="text-sm text-neutral-500">Mon-Fri 9AM-6PM IST</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-neutral-100">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                    <Mail className="text-primary-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-900">Email Support</p>
                                    <p className="text-neutral-600">support@localserve.com</p>
                                    <p className="text-sm text-neutral-500">24/7 Email Support</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-neutral-100">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="text-primary-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-900">Office Address</p>
                                    <p className="text-neutral-600">
                                        Tech Park, 5th Floor<br />
                                        Bangalore, Karnataka 560001
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="p-8">
                        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send us a Message</h2>
                        
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-success-600" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">Message Sent!</h3>
                                <p className="text-neutral-600">We'll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">First Name</label>
                                        <Input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name</label>
                                        <Input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Your Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="How can we help you?"
                                        required
                                    ></textarea>
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 py-3"
                                >
                                    <Send size={18} /> {isSubmitting ? 'Sending...' : 'Send Message'}</Button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Contact;
