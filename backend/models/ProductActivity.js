const mongoose = require("mongoose");

const ProductActivitySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      enum: ["view", "click", "offer"],
      index: true,
    },
    sessionId: {
      type: String,
      required: false, // Optional session tracking
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Compound index for efficient queries
    index: [
      { productId: 1, activityType: 1 },
      { userId: 1, createdAt: -1 },
      { productId: 1, userId: 1, activityType: 1 },
    ]
  }
);

// Prevent duplicate activities within a short time window (5 minutes)
ProductActivitySchema.index(
  { productId: 1, userId: 1, activityType: 1, createdAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }
  }
);

// Static method to track activity
ProductActivitySchema.statics.trackActivity = async function (productId, userId, activityType, metadata = {}) {
  try {
    const activity = new this({
      productId,
      userId,
      activityType,
      metadata
    });

    await activity.save();
    return activity;
  } catch (error) {
    // If duplicate within time window, ignore silently
    if (error.code === 11000) {
      return null;
    }
    throw error;
  }
};

// Static method to get activity counts for a product
ProductActivitySchema.statics.getProductActivityCounts = async function (productId) {
  const pipeline = [
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$activityType",
        count: { $sum: 1 }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  const counts = {
    view: 0,
    click: 0,
    offer: 0
  };

  results.forEach(result => {
    counts[result._id] = result.count;
  });

  return counts;
};

// Static method to calculate relevance score
ProductActivitySchema.statics.calculateRelevanceScore = function (activityCounts, weights = { view: 0.1, click: 0.3, offer: 0.6 }) {
  const { view = 0, click = 0, offer = 0 } = activityCounts;
  const { view: wv, click: wc, offer: wo } = weights;

  return (wv * view) + (wc * click) + (wo * offer);
};

// Static method to get bulk activity counts for multiple products
ProductActivitySchema.statics.getBulkActivityCounts = async function (productIds) {
  const pipeline = [
    {
      $match: {
        productId: {
          $in: productIds.map(id => new mongoose.Types.ObjectId(id))
        }
      }
    },
    {
      $group: {
        _id: {
          productId: "$productId",
          activityType: "$activityType"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.productId",
        activities: {
          $push: {
            type: "$_id.activityType",
            count: "$count"
          }
        }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  const activityMap = {};

  results.forEach(result => {
    const productId = result._id.toString();
    const counts = {
      view: 0,
      click: 0,
      offer: 0
    };

    result.activities.forEach(activity => {
      counts[activity.type] = activity.count;
    });

    activityMap[productId] = counts;
  });

  // Fill in missing products with zero counts
  productIds.forEach(id => {
    const productId = id.toString();
    if (!activityMap[productId]) {
      activityMap[productId] = {
        view: 0,
        click: 0,
        offer: 0
      };
    }
  });

  return activityMap;
};

module.exports = mongoose.model("ProductActivity", ProductActivitySchema);