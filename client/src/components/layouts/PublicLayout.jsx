import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />
            <main className="flex-grow pt-16" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
