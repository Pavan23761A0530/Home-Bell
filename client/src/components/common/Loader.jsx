import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', className, variant = 'hamster' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    if (variant === 'hamster') {
        return (
            <div className={`flex justify-center items-center p-8 ${className || ''}`}>
                <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
                    <div className="wheel"></div>
                    <div className="hamster">
                        <div className="hamster__body">
                            <div className="hamster__head">
                                <div className="hamster__ear"></div>
                                <div className="hamster__eye"></div>
                                <div className="hamster__nose"></div>
                            </div>
                            <div className="hamster__limb hamster__limb--fr"></div>
                            <div className="hamster__limb hamster__limb--fl"></div>
                            <div className="hamster__limb hamster__limb--br"></div>
                            <div className="hamster__limb hamster__limb--bl"></div>
                            <div className="hamster__tail"></div>
                        </div>
                    </div>
                    <div className="spoke"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center p-4">
            <Loader2
                className={`animate-spin text-primary-600 ${sizes[size]} ${className || ''}`}
            />
        </div>
    );
};

export default Loader;
