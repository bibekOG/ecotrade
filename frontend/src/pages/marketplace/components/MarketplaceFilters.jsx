import React, { useState, useEffect } from "react";

export default function MarketplaceFilters({
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    addTrackedSearch,
    showRecommendations,
    setShowRecommendations,
    recommendationsCount,
    onRecommendationsClick
}) {
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    const categories = ["All", "Electronics", "Clothing", "Books", "Home", "Sports", "Other"];
    const types = ["All", "Sale", "Giveaway", "Exchange"];

    // Debounce visual loading state only if needed, but here we just pass through or handle local UI state
    // Actually, the parent handles debouncing for fetching. Here we just show the spinner if they differ.
    // Wait, the parent passes searchQuery and debouncedSearchQuery? No, parent passes `searchQuery` state and setter.
    // I will check if I need debounced prop. The previous code compared searchQuery vs debouncedSearchQuery for spinner.
    // I'll accept `isSearching` prop or similar if available, or just implement spinner logic if I have debounced value from parent.
    // Looking at previous code: `searchQuery !== debouncedSearchQuery`.
    // I'll assume parent handles that logic or I can just show spinner if props differ if I pass both.
    // Let's just simplify and pass `isSearching`.

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-4 sticky top-[70px] z-30">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[120px]"
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[100px]"
                >
                    {types.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[140px]"
                    title="Sort products"
                >
                    <option value="relevance">🎯 Relevant</option>
                    <option value="most-viewed">👁️ Most Viewed</option>
                    <option value="newest">🆕 Newest</option>
                    <option value="oldest">⏰ Oldest</option>
                    <option value="name">📝 Name A-Z</option>
                    <option value="price-low">💰 Price: Low</option>
                    <option value="price-high">💰 Price: High</option>
                </select>
            </div>

            <div className="relative flex-1 w-full">
                <input
                    type="search"
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    🔍
                </span>
                {/* Spinner could go here if we had isSearching prop */}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                    type="button"
                    onClick={addTrackedSearch}
                    disabled={!searchQuery.trim()}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    title="Track this search"
                >
                    + Track
                </button>
                {sortBy === "relevance" && recommendationsCount > 0 && (
                    <button
                        type="button"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${showRecommendations
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        onClick={onRecommendationsClick}
                    >
                        🎯 Top {recommendationsCount}
                    </button>
                )}
            </div>
        </div>
    );
}
