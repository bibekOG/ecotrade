/**
 * BACKEND UPDATE INSTRUCTIONS
 * File: backend/routes/products.js
 * 
 * Add category preference boosting to the relevance sorting
 */

// STEP 1: Update line 78-86 in the relevance sorting section
// Replace the productsWithScores mapping with this enhanced version:

const productsWithScores = products.map(product => {
  const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
  let relevanceScore = ProductActivity.calculateRelevanceScore(activities);
  
  // Parse preferred categories from query parameter
  const preferredCats = preferredCategories ? 
    (Array.isArray(preferredCategories) ? preferredCategories : preferredCategories.split(',')) : 
    [];
  
  // Boost score if product is in preferred categories (50% boost)
  const categoryBoost = preferredCats.includes(product.productCategory) ? 1.5 : 1.0;
  relevanceScore = relevanceScore * categoryBoost;
  
  return {
    ...product,
    activityCounts: activities,
    relevanceScore: relevanceScore,
    categoryBoosted: categoryBoost > 1.0
  };
});

/**
 * WHAT THIS DOES:
 * 1. Parses the preferredCategories query parameter (comma-separated list)
 * 2. Checks if each product's category is in the preferred list
 * 3. Boosts the relevance score by 50% for products in preferred categories
 * 4. Adds a categoryBoosted flag to indicate which products got boosted
 * 
 * RESULT:
 * When a user views products from a category (e.g., "Electronics"), 
 * that category is tracked in localStorage. On subsequent visits,
 * Electronics products will appear higher in the "Relevant" sort order.
 */
