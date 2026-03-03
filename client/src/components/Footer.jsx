import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-primary-600">LocalServe</h3>
                        <p className="text-neutral-500 text-sm">
                            Connecting you with trusted local professionals for all your household needs. Fast, secure, and reliable.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Services</h4>
                        <ul className="space-y-2 text-sm text-neutral-600">
                            <li><Link to="/services?cat=cleaning" className="hover:text-primary-600">Home Cleaning</Link></li>
                            <li><Link to="/services?cat=repair" className="hover:text-primary-600">Appliance Repair</Link></li>
                            <li><Link to="/services?cat=plumbing" className="hover:text-primary-600">Plumbing</Link></li>
                            <li><Link to="/services?cat=electrician" className="hover:text-primary-600">Electrical</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-neutral-600">
                            <li><Link to="/about" className="hover:text-primary-600">About Us</Link></li>
                            <li><Link to="/careers" className="hover:text-primary-600">Careers</Link></li>
                            <li><Link to="/blog" className="hover:text-primary-600">Blog</Link></li>
                            <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-neutral-600">
                            <li><Link to="/help" className="hover:text-primary-600">Help Center</Link></li>
                            <li><Link to="/safety" className="hover:text-primary-600">Safety Information</Link></li>
                            <li><Link to="/terms" className="hover:text-primary-600">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center bg-white z-10 relative">
                    <p className="text-neutral-500 text-sm text-center md:text-left">
                        © {new Date().getFullYear()} LocalServe. All rights reserved.
                    </p>
                    <p className="text-neutral-400 text-sm flex items-center mt-4 md:mt-0">
                        Made with <Heart size={16} className="text-error-500 mx-1 fill-current" /> for the community
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
