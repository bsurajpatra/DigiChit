import { useEffect } from 'react';

/**
 * Reusable hook to dynamically set/override `document.title` for specific components or dynamic data views.
 * Usage: useDocumentTitle('Gold Savings Chit | DigiChit');
 */
export const useDocumentTitle = (title: string) => {
    useEffect(() => {
        if (!title) return;
        const formattedTitle = title.endsWith('DigiChit') ? title : `${title} | DigiChit`;
        document.title = formattedTitle;
    }, [title]);
};
