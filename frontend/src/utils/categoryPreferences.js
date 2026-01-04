// Category preference tracking utility
// Tracks which categories users view to personalize their marketplace experience

const STORAGE_KEY = 'marketplace_category_preferences';
const MAX_CATEGORIES = 5; // Track up to 5 most viewed categories

export const CategoryPreferences = {
    // Track when a user views a product from a category
    trackCategoryView: (category) => {
        if (!category) return;

        try {
            const prefs = CategoryPreferences.getPreferences();
            const existing = prefs.find(p => p.category === category);

            if (existing) {
                existing.count++;
                existing.lastViewed = Date.now();
            } else {
                prefs.push({
                    category,
                    count: 1,
                    lastViewed: Date.now()
                });
            }

            // Sort by count (descending) and keep only top MAX_CATEGORIES
            prefs.sort((a, b) => b.count - a.count);
            const topPrefs = prefs.slice(0, MAX_CATEGORIES);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(topPrefs));
        } catch (error) {
            console.error('Error tracking category preference:', error);
        }
    },

    // Get all tracked category preferences
    getPreferences: () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting category preferences:', error);
            return [];
        }
    },

    // Get array of preferred category names (sorted by preference)
    getPreferredCategories: () => {
        const prefs = CategoryPreferences.getPreferences();
        return prefs.map(p => p.category);
    },

    // Clear all preferences
    clearPreferences: () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing category preferences:', error);
        }
    },

    // Get preferences as query string parameter
    getPreferencesQueryParam: () => {
        const categories = CategoryPreferences.getPreferredCategories();
        return categories.length > 0 ? categories.join(',') : null;
    }
};

export default CategoryPreferences;
