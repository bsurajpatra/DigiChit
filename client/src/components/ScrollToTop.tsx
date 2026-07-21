import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route changes,
 * unless navigating back to the #footer section.
 */
const ScrollToTop = () => {
    const { pathname, hash, state } = useLocation();

    useEffect(() => {
        if (hash === '#footer' || (state as { scrollToFooter?: boolean })?.scrollToFooter) {
            return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname, hash, state]);

    return null;
};

export default ScrollToTop;
