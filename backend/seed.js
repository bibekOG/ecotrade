const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Product = require("./models/Product");
const Post = require("./models/Post");
require("dotenv").config();

// Sample data arrays
const sampleUsers = [
  {
    username: "bibek_admin",
    fullName: "Bibek",
    email: "bibek@bibek.com",
    password: "bibek12",
    contactNumber: "9800000001",
    bio: "System Administrator with full access to manage users, posts, and platform operations.",
    interest: ["Administration", "Technology", "Management", "Security"],
    dateOfBirth: new Date("1990-01-01"),
    location: "Kathmandu Valley",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    city: "Kathmandu",
    from: "Nepal",
    relationship: 1,
    desc: "Platform Admin",
    isAdmin: true
  },
  {
    username: "alice_reader",
    fullName: "Alice Johnson",
    email: "aaa@aaa.com",
    password: "aaaaaa",
    contactNumber: "9841234567",
    bio: "Avid reader and book collector. Love sharing stories and discovering new authors.",
    interest: ["Books", "Literature", "Writing", "Coffee"],
    dateOfBirth: new Date("1995-03-15"),
    location: "Kathmandu Valley",
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616c6d3fcda?w=400",
    city: "Kathmandu",
    from: "Nepal",
    relationship: 1,
    desc: "Book enthusiast"
  },
  {
    username: "bob_tech",
    fullName: "Bob Smith",
    email: "bbb@bbb.com",
    password: "bbbbbb",
    contactNumber: "9851234567",
    bio: "Tech enthusiast and gadget lover. Always looking for the latest electronics and accessories.",
    interest: ["Technology", "Electronics", "Gaming", "Programming"],
    dateOfBirth: new Date("1992-07-22"),
    location: "Pokhara",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    city: "Pokhara",
    from: "Nepal",
    relationship: 2,
    desc: "Tech geek"
  },
  {
    username: "carol_fashion",
    fullName: "Carol Davis",
    email: "ccc@ccc.com",
    password: "cccccc",
    contactNumber: "9861234567",
    bio: "Fashion designer and style consultant. Love helping people express their personality through clothing.",
    interest: ["Fashion", "Design", "Shopping", "Art"],
    dateOfBirth: new Date("1993-11-08"),
    location: "Butwal",
    profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    city: "Butwal",
    from: "Nepal",
    relationship: 1,
    desc: "Fashion lover"
  },
  {
    username: "david_sports",
    fullName: "David Wilson",
    email: "ddd@ddd.com",
    password: "dddddd",
    contactNumber: "9871234567",
    bio: "Fitness trainer and sports equipment collector. Promoting healthy lifestyle through sports.",
    interest: ["Sports", "Fitness", "Health", "Outdoor Activities"],
    dateOfBirth: new Date("1990-05-12"),
    location: "Biratnagar",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    city: "Biratnagar",
    from: "Nepal",
    relationship: 1,
    desc: "Fitness enthusiast"
  },
  {
    username: "emma_home",
    fullName: "Emma Thompson",
    email: "eee@eee.com",
    password: "eeeeee",
    contactNumber: "9881234567",
    bio: "Home decor specialist and interior design enthusiast. Creating beautiful living spaces.",
    interest: ["Home Decor", "Interior Design", "DIY", "Gardening"],
    dateOfBirth: new Date("1988-09-25"),
    location: "Dang",
    profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    city: "Dang",
    from: "Nepal",
    relationship: 2,
    desc: "Home designer"
  }
];

const sampleProducts = [
  {
    productName: "Platform Development Resources",
    productCategory: "Books",
    productType: "Brandnew",
    productFor: "Giveaway",
    desiredProduct: "Community feedback and suggestions",
    location: "Kathmandu Valley",
    claimThrough: "Online Delivery",
    validTill: new Date("2025-12-31"),
    contactDetails: "Email: admin@redersroom.com",
    productImages: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"],
    status: "Active"
  },
  {
    productName: "Harry Potter Complete Book Series",
    productCategory: "Books",
    productType: "Like New",
    usedFor: "2 years",
    issues: "Minor wear on covers",
    warranty: "No warranty",
    productFor: "Sale",
    productPrice: 5000,
    minimumPrice: 4000,
    paymentMethod: "Cash/Online",
    location: "Kathmandu Valley",
    claimThrough: "Visit Store",
    validTill: new Date("2024-12-31"),
    contactDetails: "Call: 9841234567",
    productImages: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"],
    status: "Active"
  },
  {
    productName: "iPhone 13 Pro Max",
    productCategory: "Electronics",
    productType: "Good",
    usedFor: "1 year",
    issues: "Minor scratches on back",
    warranty: "6 months remaining",
    productFor: "Sale",
    productPrice: 120000,
    minimumPrice: 110000,
    paymentMethod: "Cash/Bank Transfer",
    location: "Pokhara",
    claimThrough: "Online Delivery",
    validTill: new Date("2024-11-30"),
    contactDetails: "WhatsApp: 9851234567",
    productImages: ["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400"],
    status: "Active"
  },
  {
    productName: "Designer Winter Jacket",
    productCategory: "Clothing",
    productType: "Like New",
    usedFor: "6 months",
    issues: "No issues",
    warranty: "No warranty",
    productFor: "Exchange",
    exchangeFor: "Summer clothing or accessories",
    location: "Butwal",
    claimThrough: "Visit Store",
    validTill: new Date("2024-10-31"),
    contactDetails: "Call: 9861234567",
    productImages: ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400"],
    status: "Active"
  },
  {
    productName: "Gym Equipment Set",
    productCategory: "Sports",
    productType: "Working",
    usedFor: "3 years",
    issues: "Some rust on weights",
    warranty: "No warranty",
    productFor: "Giveaway",
    desiredProduct: "Books or educational materials",
    location: "Biratnagar",
    claimThrough: "Visit Store",
    validTill: new Date("2024-09-30"),
    contactDetails: "Call: 9871234567",
    productImages: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    status: "Active"
  },
  {
    productName: "Home Decor Package",
    productCategory: "Home",
    productType: "Like New",
    usedFor: "1 year",
    issues: "No major issues",
    warranty: "No warranty",
    productFor: "Sale",
    productPrice: 8000,
    minimumPrice: 6000,
    paymentMethod: "Cash only",
    location: "Dang",
    claimThrough: "Visit Store",
    validTill: new Date("2024-12-15"),
    contactDetails: "Call: 9881234567",
    productImages: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"],
    status: "Active"
  }
];

const samplePosts = [
  {
    desc: "Welcome to RedersRoom! We're committed to providing a safe and engaging platform for everyone. Report any issues to keep our community thriving! 🌟🛡️",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
    tags: ["admin", "welcome", "community"],
    likes: [],
    comment: 0
  },
  {
    desc: "Just finished reading 'The Alchemist' - such an inspiring book! Looking for book recommendations for my next read. 📚✨",
    img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
    tags: ["books", "reading", "inspiration"],
    likes: [],
    comment: 0
  },
  {
    desc: "Check out my latest tech setup! New monitor and keyboard arrived today. Perfect for coding sessions 💻⌨️",
    img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    tags: ["technology", "setup", "coding"],
    likes: [],
    comment: 0
  },
  {
    desc: "Fashion tip: Layering is key for this season! Mix textures and colors to create unique looks 👗✨",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
    tags: ["fashion", "style", "tips"],
    likes: [],
    comment: 0
  },
  {
    desc: "Morning workout done! Remember, consistency is more important than perfection. Keep moving! 💪🏋️",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
    tags: ["fitness", "workout", "motivation"],
    likes: [],
    comment: 0
  },
  {
    desc: "Transformed my living room with these simple decor changes. Small updates can make a big difference! 🏠✨",
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
    tags: ["home", "decor", "interior"],
    likes: [],
    comment: 0
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Seed function
const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await Post.deleteMany({});

    // Create users
    console.log("Creating users...");
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${userData.username}`);
    }

    // Create products (assign to random users)
    console.log("Creating products...");
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = new Product({
        ...sampleProducts[i],
        userId: createdUsers[i]._id
      });
      
      await product.save();
      console.log(`Created product: ${sampleProducts[i].productName}`);
    }

    // Create posts (assign to random users)
    console.log("Creating posts...");
    for (let i = 0; i < samplePosts.length; i++) {
      const post = new Post({
        ...samplePosts[i],
        userId: createdUsers[i]._id.toString()
      });
      
      await post.save();
      console.log(`Created post by: ${createdUsers[i].username}`);
    }

    // Add some friendships and interactions
    console.log("Adding friendships and interactions...");
    
    // Make users friends with each other
    for (let i = 0; i < createdUsers.length; i++) {
      const friendIndices = [];
      // Add 2-3 random friends
      while (friendIndices.length < Math.min(2, createdUsers.length - 1)) {
        const randomIndex = Math.floor(Math.random() * createdUsers.length);
        if (randomIndex !== i && !friendIndices.includes(randomIndex)) {
          friendIndices.push(randomIndex);
        }
      }
      
      const friendIds = friendIndices.map(index => createdUsers[index]._id);
      
      await User.findByIdAndUpdate(createdUsers[i]._id, {
        $push: { friends: { $each: friendIds } }
      });
    }

    // Add some likes to posts
    const posts = await Post.find({});
    for (const post of posts) {
      // Add random likes
      const likesCount = Math.floor(Math.random() * 4) + 1;
      const likers = [];
      
      while (likers.length < likesCount) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (!likers.includes(randomUser._id.toString()) && randomUser._id.toString() !== post.userId) {
          likers.push(randomUser._id.toString());
        }
      }
      
      await Post.findByIdAndUpdate(post._id, {
        $set: { likes: likers }
      });
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n🔐 ADMIN CREDENTIALS:");
    console.log("Email: bibek@bibek.com");
    console.log("Password: bibekAdminPassword");
    console.log("Role: Administrator\n");
    
    console.log("📝 Sample users created:");
    createdUsers.forEach(user => {
      const role = user.isAdmin ? " (ADMIN)" : "";
      console.log(`- ${user.username} (${user.email})${role}`);
    });

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
};

runSeed();