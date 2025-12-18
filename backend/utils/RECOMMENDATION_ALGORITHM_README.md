# Recommendation Algorithm - Detailed User Similarity Comparison

## Overview

This implementation provides a fully functional recommendation system with **detailed user similarity comparison** that includes transparent vector representations for analysis.

## Key Features

✅ **Tag Extraction** - Extracts hashtags from post descriptions  
✅ **Tag Vector Normalization** - Converts Map/Object to plain objects  
✅ **Cosine Similarity** - Calculates similarity between user tag vectors  
✅ **User Similarity Matrix** - Detailed comparison with full transparency (vectors included)  
✅ **Content-Based Filtering** - Uses cosine similarity between user preferences and post tags  
✅ **Collaborative Filtering** - Uses actual post likes from similar users  
✅ **Hybrid Recommendation** - Combines content-based (70%) + collaborative (30%) scoring  

## Functions

### 1. `extractTagsFromText(desc)`
Extracts hashtags from text descriptions.

```javascript
const tags = extractTagsFromText("Check out this #book #read");
// Returns: ["book", "read"]
```

### 2. `normalizeTagMap(tagMap)`
Converts Mongoose Map or plain object to normalized tag vector.

### 3. `cosineSimilarity(vecA, vecB)`
Calculates cosine similarity between two tag vectors (0-1 scale).

### 4. `computeUserSimilarities()`
**⭐ Detailed User Comparison Function**

Returns full similarity matrix with vectors for transparency:

```javascript
[
  {
    "userA": "userId1",
    "userB": "userId2",
    "vectorA": { "books": 5, "reuse": 3, "tech": 1 },
    "vectorB": { "books": 4, "reuse": 2 },
    "similarity": 0.9487
  }
]
```

### 5. `updateUserTagInteractions(userId, tags, action)`
Updates user tag interaction vector based on actions:
- `like`: weight 1
- `comment`: weight 2
- `view`: weight 0.5
- `unlike`: weight -1

### 6. `scorePostForUser(userVector, postTags, postLikes, postUserId, similarUsers, userId)`
Scores a post using:
- **Content-based**: Cosine similarity between user vector and post tags
- **Collaborative**: Similar users who liked the post or authored it

Returns:
```javascript
{
  contentScore: 0.7542,
  collabScore: 0.3210,
  finalScore: 0.6454,
  tags: ["book", "read"]
}
```

### 7. `recommendPostsForUser(userId, limit)`
Full recommendation function that:
1. Gets user's tag vector
2. Computes global user similarities
3. Filters top similar users (threshold > 0.1)
4. Scores all candidate posts
5. Returns top N recommendations with detailed scores

## API Endpoint

### GET `/api/search/similarity-matrix`

Returns the full user similarity matrix with user details:

**Response:**
```json
{
  "totalComparisons": 45,
  "similarities": [
    {
      "userA": "userId1",
      "userB": "userId2",
      "vectorA": { "books": 5, "reuse": 3 },
      "vectorB": { "books": 4, "reuse": 2 },
      "similarity": 0.9487,
      "userADetails": {
        "_id": "userId1",
        "username": "alice",
        "fullName": "Alice Smith"
      },
      "userBDetails": {
        "_id": "userId2",
        "username": "bob",
        "fullName": "Bob Jones"
      }
    }
  ]
}
```

## Usage Example

```javascript
const { 
  computeUserSimilarities, 
  recommendPostsForUser 
} = require("./utils/recommendationUtils");

// Get detailed user similarity matrix
const similarities = await computeUserSimilarities();
console.log(similarities);
// Output: Full matrix with vectors for transparency

// Get recommendations for a user
const recommendations = await recommendPostsForUser("userId123", 10);
console.log(recommendations);
// Output: Array of posts with scores
```

## Integration Points

1. **Post Creation**: Tags are automatically extracted and stored
2. **Post Like**: `updateUserTagInteractions(userId, tags, "like")` is called
3. **Post Comment**: `updateUserTagInteractions(userId, tags, "comment")` is called
4. **Recommendations**: Available via `/api/posts/recommended/:userId`

## Algorithm Details

### Content-Based Scoring (70%)
- Uses cosine similarity between user's tag preference vector and post's tag vector
- Measures how well post content matches user interests

### Collaborative Filtering (30%)
- Checks if similar users liked the post
- Gives bonus weight if similar user authored the post
- Uses actual interaction data (likes array)

### Similarity Threshold
- Only includes user pairs with similarity > 0.1
- Sorts similar users by similarity score (descending)

## Performance Considerations

- Similarity matrix computation is O(n²) where n = number of users
- Consider caching similarity matrix for large user bases
- Recommendation function filters posts before scoring (excludes user's own posts)

## Future Enhancements

- Cache similarity matrix with TTL
- Add time-decay factors for recent interactions
- Include view tracking for more accurate collaborative signals
- Add product recommendations using similar algorithm


