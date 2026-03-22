import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 text-center px-4">
            <h1 className="text-9xl font-bold text-blue-200">404</h1>
            <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Page Not Found</h2>
            <p className="text-gray-600 max-w-md mb-8">
                Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center"
            >
                <Home size={20} className="mr-2" />
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
