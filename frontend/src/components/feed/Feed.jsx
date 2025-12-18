import { useContext, useEffect, useState } from "react";
import Post from "../post/Post";
import Share from "../share/Share";
import "./feed.css";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";

export default function Feed({ username }) {
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("recommended");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchPosts = async (filter) => {
    if (!user) {
      console.log("No authenticated user, skipping post fetch");
      return;
    }
    
    setLoading(true);
    try {
      let res;
      switch (filter) {
        case "recommended":
          res = await apiClient.get(`/posts/recommended/${user._id}`);
          break;
        case "friends":
          res = await apiClient.get(`/posts/friends/${user._id}`);
          // Ensure we have valid posts from friends
          if (res.data && Array.isArray(res.data)) {
            // Filter out any null or undefined posts
            res.data = res.data.filter(post => post !== null && post !== undefined);
          }
          break;
        case "recent":
          res = await apiClient.get("/posts/recent");
          break;
        case "my":
          res = await apiClient.get(`/posts/my/${user._id}`);
          break;
        default:
          res = username
            ? await apiClient.get("/posts/profile/" + username)
            : await apiClient.get("/posts/timeline/" + user._id);
      }
      
      const payload = Array.isArray(res?.data) ? res.data : [];

      // Preserve server ordering for recommended (already ranked by CF algorithm)
      if (filter === "recommended") {
        setPosts(payload);
        return;
      }

      // Other filters keep recency ordering client-side
      setPosts(
        payload.sort((p1, p2) => {
          return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
      );
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Don't fetch posts if user is not authenticated
      return;
    }
    
    if (username) {
      // If viewing a profile, use the original logic
      const fetchProfilePosts = async () => {
        try {
          const res = await apiClient.get("/posts/profile/" + username);
          setPosts(
            res.data.sort((p1, p2) => {
              return new Date(p2.createdAt) - new Date(p1.createdAt);
            })
          );
        } catch (err) {
          console.error("Error fetching profile posts:", err);
        }
      };
      fetchProfilePosts();
    } else {
      // If on home page, use the filter system
      fetchPosts(activeFilter);
    }
  }, [username, user, activeFilter]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  if (username) {
    // Profile view - show original feed
    return (
      <div className="feed">
        <div className="feedWrapper">
          {(!username || username === user?.username) && <Share />}
          {posts.map((p) => (
            <Post key={p._id} post={p} />
          ))}
        </div>
      </div>
    );
  }
  
  // Don't render feed if user is not authenticated
  if (!user) {
    return (
      <div className="feed">
        <div className="feedWrapper">
          <div className="noAuthMessage">
            <p>Please log in to view posts</p>
          </div>
        </div>
      </div>
    );
  }

  // Home page view - show filtered feed
  return (
    <div className="feed">
      <div className="feedWrapper">
        <Share />
        
        {/* Filter Tabs */}
        <div className="feedFilters">
          <button
            className={`filterTab ${activeFilter === "recommended" ? "active" : ""}`}
            onClick={() => handleFilterChange("recommended")}
          >
            Recommended
          </button>
          <button
            className={`filterTab ${activeFilter === "friends" ? "active" : ""}`}
            onClick={() => handleFilterChange("friends")}
          >
            Friends
          </button>
          <button
            className={`filterTab ${activeFilter === "recent" ? "active" : ""}`}
            onClick={() => handleFilterChange("recent")}
          >
            Recent
          </button>
          <button
            className={`filterTab ${activeFilter === "my" ? "active" : ""}`}
            onClick={() => handleFilterChange("my")}
          >
            My Posts
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loadingPosts">
            <div className="loadingSpinner"></div>
            <p>Loading posts...</p>
          </div>
        )}

        {/* Posts */}
        {!loading && posts.length === 0 && (
          <div className="noPosts">
            {activeFilter === "friends" ? (
              <>
                <p>No posts from your friends yet.</p>
                <p style={{ fontSize: "14px", color: "#657786", marginTop: "8px" }}>
                  Start following people to see their posts here!
                </p>
              </>
            ) : (
              <p>No posts found for this filter.</p>
            )}
          </div>
        )}

        {!loading && posts.map((p) => {
          // Additional validation to ensure post has required fields
          if (!p || !p._id) return null;
          return <Post key={p._id} post={p} />;
        })}
      </div>
    </div>
  );
}
