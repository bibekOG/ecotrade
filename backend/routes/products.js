const router = require("express").Router();
const Product = require("../models/Product");
const ProductMessage = require("../models/ProductMessage");
const User = require("../models/User");
const ProductActivity = require("../models/ProductActivity");
const { createOfferAcceptedNotification, createOfferRejectedNotification } = require("../utils/notificationService");

// Create a product
router.post("/", async (req, res) => {
  try {
    // Log incoming product data for debugging
    console.log("Creating product with images:", {
      productName: req.body.productName,
      userId: req.body.userId,
      imageCount: req.body.productImages?.length || 0,
      images: req.body.productImages
    });

    const newProduct = new Product({
      userId: req.body.userId,
      productName: req.body.productName,
      productCategory: req.body.productCategory,
      productType: req.body.productType,
      usedFor: req.body.usedFor,
      issues: req.body.issues,
      warranty: req.body.warranty,
      productFor: req.body.productFor,
      productPrice: req.body.productPrice,
      minimumPrice: req.body.minimumPrice,
      paymentMethod: req.body.paymentMethod,
      desiredProduct: req.body.desiredProduct,
      exchangeFor: req.body.exchangeFor,
      location: req.body.location,
      claimThrough: req.body.claimThrough,
      validTill: req.body.validTill,
      contactDetails: req.body.contactDetails,
      productImages: req.body.productImages || [],
    });

    const savedProduct = await newProduct.save();

    console.log("Product created successfully:", {
      productId: savedProduct._id,
      imageCount: savedProduct.productImages?.length || 0,
      images: savedProduct.productImages
    });

    res.status(200).json(savedProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json(err);
  }
});

// Get all products with activity-based sorting
router.get("/", async (req, res) => {
  try {
    const { sortBy = "relevance", limit, page = 1, preferredCategories } = req.query;
    const pageSize = limit ? parseInt(limit) : undefined;
    const skip = pageSize ? (parseInt(page) - 1) * pageSize : 0;

    let query = Product.find({ status: "Active" })
      .populate("userId", "username profilePicture");

    if (sortBy === "relevance") {
      // Get products first
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      // Get activity counts for all products
      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      // Calculate relevance scores and add to products
      const productsWithScores = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        const relevanceScore = ProductActivity.calculateRelevanceScore(activities);

        return {
          ...product,
          activityCounts: activities,
          relevanceScore: relevanceScore
        };
      });

      // Sort by relevance score (highest first), then by creation date
      productsWithScores.sort((a, b) => {
        if (a.relevanceScore === b.relevanceScore) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.relevanceScore - a.relevanceScore;
      });

      // Apply pagination if specified
      const paginatedProducts = pageSize ?
        productsWithScores.slice(skip, skip + pageSize) :
        productsWithScores;

      res.status(200).json(paginatedProducts);
    } else if (sortBy === "most-viewed") {
      // Sort by view count
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      const productsWithViews = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        return {
          ...product,
          activityCounts: activities,
          viewCount: activities.view
        };
      });

      // Sort by view count (highest first), then by creation date
      productsWithViews.sort((a, b) => {
        if (a.viewCount === b.viewCount) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.viewCount - a.viewCount;
      });

      const paginatedProducts = pageSize ?
        productsWithViews.slice(skip, skip + pageSize) :
        productsWithViews;

      res.status(200).json(paginatedProducts);
    } else {
      // Standard sorting options
      let sortOption = {};
      switch (sortBy) {
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "name":
          sortOption = { productName: 1 };
          break;
        case "price-low":
          sortOption = { productPrice: 1 };
          break;
        case "price-high":
          sortOption = { productPrice: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }

      if (pageSize) {
        query = query.skip(skip).limit(pageSize);
      }

      const products = await query.sort(sortOption);
      res.status(200).json(products);
    }
  } catch (err) {
    console.error("Error getting products:", err);
    res.status(500).json(err);
  }
});

// Get products by category with activity-based sorting
router.get("/category/:category", async (req, res) => {
  try {
    const { sortBy = "relevance", limit, page = 1 } = req.query;
    const pageSize = limit ? parseInt(limit) : undefined;
    const skip = pageSize ? (parseInt(page) - 1) * pageSize : 0;

    let query = Product.find({
      productCategory: req.params.category,
      status: "Active"
    }).populate("userId", "username profilePicture");

    if (sortBy === "relevance") {
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      const productsWithScores = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        const relevanceScore = ProductActivity.calculateRelevanceScore(activities);

        return {
          ...product,
          activityCounts: activities,
          relevanceScore: relevanceScore
        };
      });

      productsWithScores.sort((a, b) => {
        if (a.relevanceScore === b.relevanceScore) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.relevanceScore - a.relevanceScore;
      });

      const paginatedProducts = pageSize ?
        productsWithScores.slice(skip, skip + pageSize) :
        productsWithScores;

      res.status(200).json(paginatedProducts);
    } else if (sortBy === "most-viewed") {
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      const productsWithViews = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        return {
          ...product,
          activityCounts: activities,
          viewCount: activities.view
        };
      });

      productsWithViews.sort((a, b) => {
        if (a.viewCount === b.viewCount) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.viewCount - a.viewCount;
      });

      const paginatedProducts = pageSize ?
        productsWithViews.slice(skip, skip + pageSize) :
        productsWithViews;

      res.status(200).json(paginatedProducts);
    } else {
      let sortOption = { createdAt: -1 };
      if (pageSize) {
        query = query.skip(skip).limit(pageSize);
      }

      const products = await query.sort(sortOption);
      res.status(200).json(products);
    }
  } catch (err) {
    console.error("Error getting products by category:", err);
    res.status(500).json(err);
  }
});

// Get products by type (Sale, Giveaway, Exchange) with activity-based sorting
router.get("/type/:type", async (req, res) => {
  try {
    const { sortBy = "relevance", limit, page = 1 } = req.query;
    const pageSize = limit ? parseInt(limit) : undefined;
    const skip = pageSize ? (parseInt(page) - 1) * pageSize : 0;

    let query = Product.find({
      productFor: req.params.type,
      status: "Active"
    }).populate("userId", "username profilePicture");

    if (sortBy === "relevance") {
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      const productsWithScores = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        const relevanceScore = ProductActivity.calculateRelevanceScore(activities);

        return {
          ...product,
          activityCounts: activities,
          relevanceScore: relevanceScore
        };
      });

      productsWithScores.sort((a, b) => {
        if (a.relevanceScore === b.relevanceScore) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.relevanceScore - a.relevanceScore;
      });

      const paginatedProducts = pageSize ?
        productsWithScores.slice(skip, skip + pageSize) :
        productsWithScores;

      res.status(200).json(paginatedProducts);
    } else if (sortBy === "most-viewed") {
      const products = await query.lean();

      if (products.length === 0) {
        return res.status(200).json([]);
      }

      const productIds = products.map(p => p._id);
      const activityData = await ProductActivity.getBulkActivityCounts(productIds);

      const productsWithViews = products.map(product => {
        const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
        return {
          ...product,
          activityCounts: activities,
          viewCount: activities.view
        };
      });

      productsWithViews.sort((a, b) => {
        if (a.viewCount === b.viewCount) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.viewCount - a.viewCount;
      });

      const paginatedProducts = pageSize ?
        productsWithViews.slice(skip, skip + pageSize) :
        productsWithViews;

      res.status(200).json(paginatedProducts);
    } else {
      let sortOption = { createdAt: -1 };
      if (pageSize) {
        query = query.skip(skip).limit(pageSize);
      }

      const products = await query.sort(sortOption);
      res.status(200).json(products);
    }
  } catch (err) {
    console.error("Error getting products by type:", err);
    res.status(500).json(err);
  }
});

// Get recommended products based on activity
router.get("/recommendations", async (req, res) => {
  try {
    const { limit = 10, userId } = req.query;

    // Get all active products
    const products = await Product.find({ status: "Active" })
      .populate("userId", "username profilePicture")
      .lean();

    if (products.length === 0) {
      return res.status(200).json([]);
    }

    // Get activity data for all products
    const productIds = products.map(p => p._id);
    const activityData = await ProductActivity.getBulkActivityCounts(productIds);

    // Calculate scores and sort by relevance
    const productsWithScores = products.map(product => {
      const activities = activityData[product._id.toString()] || { view: 0, click: 0, offer: 0 };
      const relevanceScore = ProductActivity.calculateRelevanceScore(activities);

      return {
        ...product,
        activityCounts: activities,
        relevanceScore: relevanceScore
      };
    }).sort((a, b) => {
      // Sort by relevance score first, then by creation date
      if (a.relevanceScore === b.relevanceScore) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // Apply limit
    const recommendations = productsWithScores.slice(0, parseInt(limit));

    res.status(200).json(recommendations);
  } catch (err) {
    console.error("Error getting recommendations:", err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// Get a specific product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("userId", "username profilePicture")
      .populate("offers.userId", "username profilePicture")
      .populate("claims.userId", "username profilePicture");

    // Log product images for debugging
    if (product && product.productImages) {
      console.log(`Product ${req.params.id} images:`, product.productImages);
    }

    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json(err);
  }
});

// Update a product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      await product.updateOne({ $set: req.body });
      res.status(200).json("Product has been updated");
    } else {
      return res.status(403).json("You can update only your product");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      await product.updateOne({ status: "Removed" });
      res.status(200).json("Product has been removed");
    } else {
      return res.status(403).json("You can delete only your product");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Make an offer on a product
router.post("/:id/offer", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const offer = {
      userId: req.body.userId,
      offerAmount: req.body.offerAmount,
      exchangeProduct: req.body.exchangeProduct,
      claimTill: req.body.claimTill,
      message: req.body.message,
    };

    await product.updateOne({
      $push: { offers: offer }
    });
    res.status(200).json("Offer submitted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Claim a product (for giveaways)
router.post("/:id/claim", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const claim = {
      userId: req.body.userId,
      claimTill: req.body.claimTill,
      message: req.body.message,
    };

    await product.updateOne({
      $push: { claims: claim }
    });
    res.status(200).json("Claim submitted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Accept/Reject offer
router.put("/:id/offer/:offerId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      await Product.updateOne(
        {
          _id: req.params.id,
          "offers._id": req.params.offerId
        },
        {
          $set: { "offers.$.status": req.body.status }
        }
      );
      res.status(200).json("Offer status updated");
    } else {
      return res.status(403).json("You can only manage offers on your products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Accept/Reject claim
router.put("/:id/claim/:claimId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      await Product.updateOne(
        {
          _id: req.params.id,
          "claims._id": req.params.claimId
        },
        {
          $set: { "claims.$.status": req.body.status }
        }
      );
      res.status(200).json("Claim status updated");
    } else {
      return res.status(403).json("You can only manage claims on your products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get user's products
router.get("/user/:userId", async (req, res) => {
  try {
    const products = await Product.find({ userId: req.params.userId })
      .populate("userId", "username profilePicture")
      .sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get user's offers
router.get("/offers/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      "offers.userId": req.params.userId
    })
      .populate("userId", "username profilePicture")
      .populate("offers.userId", "username profilePicture");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get user's claims
router.get("/claims/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      "claims.userId": req.params.userId
    })
      .populate("userId", "username profilePicture")
      .populate("claims.userId", "username profilePicture");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get offers received by product owner
router.get("/received-offers/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.params.userId,
      "offers.0": { $exists: true }
    })
      .populate("userId", "username profilePicture")
      .populate("offers.userId", "username profilePicture")
      .populate("currentBuyer", "username profilePicture");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get claims received by product owner
router.get("/received-claims/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.params.userId,
      "claims.0": { $exists: true }
    })
      .populate("userId", "username profilePicture")
      .populate("claims.userId", "username profilePicture")
      .populate("currentBuyer", "username profilePicture");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update product status (Active, Booked, Sold, etc.)
router.put("/:id/status", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      const updateData = { status: req.body.status };

      // If marking as sold or booked, set current buyer and transaction details
      if (req.body.status === "Sold" || req.body.status === "Booked") {
        updateData.currentBuyer = req.body.buyerId;
        updateData.transactionStatus = "Confirmed";
        updateData.transactionDate = new Date();
      }

      // If marking as active again, clear buyer and transaction details
      if (req.body.status === "Active") {
        updateData.currentBuyer = null;
        updateData.transactionStatus = "None";
        updateData.transactionDate = null;
      }

      await product.updateOne({ $set: updateData });
      res.status(200).json("Product status updated successfully");
    } else {
      return res.status(403).json("You can only update status of your own products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Accept offer and update product status
router.put("/:id/accept-offer/:offerId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      // Find the accepted offer to extract amount/exchange info
      const offer = (product.offers || []).find(o => o._id.toString() === req.params.offerId);
      const acceptedAmount = offer?.offerAmount;

      // Update the offer status
      await Product.updateOne(
        {
          _id: req.params.id,
          "offers._id": req.params.offerId
        },
        {
          $set: {
            "offers.$.status": "Accepted",
            "offers.$.responseMessage": req.body.responseMessage || "Offer accepted",
            "offers.$.respondedAt": new Date()
          }
        }
      );

      // Update product status and set current buyer
      await Product.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: "Booked",
            currentBuyer: req.body.buyerId,
            transactionStatus: "Confirmed",
            transactionDate: new Date()
          }
        }
      );

      // Send an automatic message to the buyer informing acceptance and price
      try {
        const autoMessageText = (typeof acceptedAmount === 'number' && !isNaN(acceptedAmount))
          ? `Your offer has been accepted at NRs. ${acceptedAmount}.`
          : `Your offer has been accepted.`;

        const autoMessage = new ProductMessage({
          productId: product._id,
          senderId: product.userId,           // seller
          receiverId: req.body.buyerId,       // buyer
          message: autoMessageText,
          messageType: "text",
        });
        await autoMessage.save();
      } catch (autoMsgErr) {
        console.error("Error sending automatic acceptance message:", autoMsgErr);
        // Do not fail the request on auto message error
      }

      // Create notification for offer accepted
      try {
        const offerDetails = {
          offerAmount: acceptedAmount,
          message: req.body.responseMessage || "Offer accepted"
        };
        await createOfferAcceptedNotification(product._id, product.userId, req.body.buyerId, offerDetails);
      } catch (notificationError) {
        console.error("Error creating offer accepted notification:", notificationError);
      }

      res.status(200).json("Offer accepted and product status updated");
    } else {
      return res.status(403).json("You can only accept offers on your own products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Accept claim and update product status
router.put("/:id/accept-claim/:claimId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      // Update the claim status
      await Product.updateOne(
        {
          _id: req.params.id,
          "claims._id": req.params.claimId
        },
        {
          $set: {
            "claims.$.status": "Accepted",
            "claims.$.responseMessage": req.body.responseMessage || "Claim accepted",
            "claims.$.respondedAt": new Date()
          }
        }
      );

      // Update product status and set current buyer
      await Product.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: "Booked",
            currentBuyer: req.body.buyerId,
            transactionStatus: "Confirmed",
            transactionDate: new Date()
          }
        }
      );

      res.status(200).json("Claim accepted and product status updated");
    } else {
      return res.status(403).json("You can only accept claims on your own products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Complete transaction (mark as sold)
router.put("/:id/complete-transaction", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product.userId.toString() === req.body.userId) {
      await Product.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: "Sold",
            transactionStatus: "Completed",
            transactionDate: new Date()
          }
        }
      );
      res.status(200).json("Transaction completed successfully");
    } else {
      return res.status(403).json("You can only complete transactions on your own products");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get transaction history for a user
router.get("/transactions/:userId", async (req, res) => {
  try {
    // Get user's own products with any status
    const userProducts = await Product.find({
      userId: req.params.userId
    })
      .populate("userId", "username profilePicture")
      .populate("currentBuyer", "username profilePicture")
      .populate("offers.userId", "username profilePicture")
      .populate("claims.userId", "username profilePicture");

    // Get products where user has made offers
    const userOffers = await Product.find({
      "offers.userId": req.params.userId
    })
      .populate("userId", "username profilePicture")
      .populate("offers.userId", "username profilePicture");

    // Get products where user has made claims
    const userClaims = await Product.find({
      "claims.userId": req.params.userId
    })
      .populate("userId", "username profilePicture")
      .populate("claims.userId", "username profilePicture");

    res.status(200).json({
      userProducts,
      userOffers,
      userClaims
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
