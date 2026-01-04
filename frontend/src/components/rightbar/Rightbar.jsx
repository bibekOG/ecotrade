import "./rightbar.css";
import Online from "../online/Online";
import { useContext, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Add, Remove } from "@material-ui/icons";
import { getProfileImageUrl } from "../../utils/imageUtils";

export default function Rightbar({ user }) {
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
  const [friends, setFriends] = useState([]);
  const [myFriends, setMyFriends] = useState([]);

  const { user: currentUser, dispatch } = useContext(AuthContext);
  const [followed, setFollowed] = useState(
    currentUser?.followings?.includes(user?._id)
  );

  useEffect(() => {
    const checkFollowed = () => {
      setFollowed(currentUser?.followings?.includes(user?._id))
    }
    checkFollowed()
  }, [user, currentUser])

  useEffect(() => {
    const MygetFriends = async () => {
      try {
        if (!currentUser?._id) return;
        const { data } = await apiClient.get(`/users/friends/${currentUser._id}`);
        setMyFriends(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
      }
    };
    MygetFriends();
  }, [currentUser]);

  useEffect(() => {
    const getFriends = async () => {
      try {
        if (!user?._id) return;
        const { data } = await apiClient.get("/users/friends/" + user._id);
        setFriends(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
      }
    };
    getFriends();
  }, [user]);

  const handleClick = async () => {
    try {
      if (followed) {
        await apiClient.put(`/users/${user._id}/unfollow`, {
          userId: currentUser._id,
        });
        dispatch({ type: "UNFOLLOW", payload: user._id });
      } else {
        await apiClient.put(`/users/${user._id}/follow`, {
          userId: currentUser._id,
        });
        dispatch({ type: "FOLLOW", payload: user._id });
      }
      setFollowed(!followed)
    } catch (err) {
      console.log(err);
    }
  };

  const [ads, setAds] = useState([]);

  // Fetch ads from database
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await apiClient.get("/ads");
        setAds(res.data);
      } catch (err) {
        // Fallback to static ads if API fails
        setAds([
          {
            _id: 1,
            title: "BookStore Nepal",
            description: "Get 20% off on all bestsellers!",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            link: "#",
            tag: "Books"
          },
          {
            _id: 2,
            title: "TechZone KTM",
            description: "Latest gadgets at unbeatable prices",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
            link: "#",
            tag: "Electronics"
          }
        ]);
      }
    };

    fetchAds();
  }, []);

  const handleAdClick = async (ad) => {
    try {
      await apiClient.put(`/ads/${ad._id}/click`);
      if (ad.link && ad.link !== "#") {
        window.open(ad.link, '_blank');
      }
    } catch (err) {
      console.error("Error tracking ad click:", err);
    }
  };

  const HomeRightbar = () => {
    return (
      <>
        <div className="birthdayContainer">
          <img className="birthdayImg" src="assets/gift.png" alt="" />
          <span className="birthdayText">
            <b>Pola Foster</b> and <b>3 other friends</b> have a birthday today.
          </span>
        </div>

        {/* Enhanced Ads Section */}
        <div className="adsSection">
          <div className="rightbarTitle">Sponsored</div>
          {ads.map((ad) => (
            <div key={ad._id} className="adCard" onClick={() => handleAdClick(ad)}>
              <img className="adImage" src={ad.image} alt={ad.title} />
              <div className="adContent">
                <div className="adTitle">{ad.title}</div>
                <div className="adDescription">{ad.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trending Topics */}
        <div className="trendingSection">
          <h4 className="rightbarTitle">Trending Now</h4>
          <div className="trendingTopics">
            <div className="trendingItem">
              <span className="trendingText">#BookLovers</span>
              <span className="trendingCount">2.3K posts</span>
            </div>
            <div className="trendingItem">
              <span className="trendingText">#TechDeals</span>
              <span className="trendingCount">1.8K posts</span>
            </div>
            <div className="trendingItem">
              <span className="trendingText">#FashionTips</span>
              <span className="trendingCount">3.1K posts</span>
            </div>
          </div>
        </div>

        <h4 className="rightbarTitle">Online Friends</h4>
        <ul className="rightbarFriendList">
          {myFriends.map((friend) => (
            <Online key={friend?._id} user={friend} />
          ))}
        </ul>
      </>
    );
  };

  const ProfileRightbar = () => {
    return (
      <>
        {user?.username !== currentUser?.username && (
          <button className="rightbarFollowButton" onClick={handleClick}>
            {followed ? "Unfollow" : "Follow"}
            {followed ? <Remove /> : <Add />}
          </button>
        )}
        <h4 className="rightbarTitle">User information</h4>
        <div className="rightbarInfo">
          <div className="rightbarInfoItem">
            <span className="rightbarInfoKey">City:</span>
            <span className="rightbarInfoValue">{user.city}</span>
          </div>
          <div className="rightbarInfoItem">
            <span className="rightbarInfoKey">From:</span>
            <span className="rightbarInfoValue">{user.from}</span>
          </div>
          <div className="rightbarInfoItem">
            <span className="rightbarInfoKey">Relationship:</span>
            <span className="rightbarInfoValue">
              {user.relationship === 1
                ? "Single"
                : user.relationship === 2
                  ? "Married"
                  : "-"}
            </span>
          </div>
        </div>
        <h4 className="rightbarTitle">User friends</h4>
        <div className="rightbarFollowings">
          {friends.map((friend) => (
            <Link
              to={"/profile/" + friend.username}
              style={{ textDecoration: "none" }}
              key={friend._id}
            >
              <div className="rightbarFollowing">
                <img
                  src={getProfileImageUrl(friend.profilePicture)}
                  alt={friend.username}
                  className="rightbarFollowingImg"
                />
                <span className="rightbarFollowingName">{friend.username}</span>
              </div>
            </Link>
          ))}
        </div>
      </>
    );
  };
  return (
    <div className="rightbar">
      <div className="rightbarWrapper">
        {user ? <ProfileRightbar /> : <HomeRightbar />}
      </div>
    </div>
  );
}

