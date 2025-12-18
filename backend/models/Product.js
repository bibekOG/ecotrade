const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      max: 100,
    },
    productCategory: {
      type: String,
      required: true,
      enum: ["Electronics", "Clothing", "Books", "Home", "Sports", "Other"],
    },
    productType: {
      type: String,
      required: true,
      enum: ["Brandnew", "Like New", "Good", "Working"],
    },
    usedFor: {
      type: String,
      required: function() { return this.productType !== "Brandnew"; },
    },
    issues: {
      type: String,
      required: function() { return this.productType !== "Brandnew"; },
    },
    warranty: {
      type: String,
      required: function() { return this.productType !== "Brandnew"; },
    },
    productFor: {
      type: String,
      required: true,
      enum: ["Sale", "Giveaway", "Exchange"],
    },
    // Sale specific fields
    productPrice: {
      type: Number,
      required: function() { return this.productFor === "Sale"; },
    },
    minimumPrice: {
      type: Number,
      required: function() { return this.productFor === "Sale"; },
    },
    paymentMethod: {
      type: String,
      required: function() { return this.productFor === "Sale"; },
    },
    // Giveaway specific fields
    desiredProduct: {
      type: String,
      required: function() { return this.productFor === "Giveaway"; },
    },
    // Exchange specific fields
    exchangeFor: {
      type: String,
      required: function() { return this.productFor === "Exchange"; },
    },
    // Common fields
    location: {
      type: String,
      required: true,
      enum: ["Kathmandu Valley", "Butwal", "Pokhara", "Dang", "Kohalpur", "Biratnagar"],
    },
    claimThrough: {
      type: String,
      required: true,
      enum: ["Online Delivery", "Visit Store"],
    },
    validTill: {
      type: Date,
      required: true,
    },
    contactDetails: {
      type: String,
      required: true,
    },
    productImages: [{
      type: String,
    }],
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Booked", "Sold", "Expired", "Removed", "In Progress"],
    },
    // Enhanced tracking fields
    currentBuyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transactionStatus: {
      type: String,
      default: "None",
      enum: ["None", "Pending", "Confirmed", "Completed", "Cancelled"],
    },
    transactionDate: {
      type: Date,
    },
    offers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      offerAmount: {
        type: Number,
        required: function() { return this.parent().productFor === "Sale"; },
      },
      exchangeProduct: {
        type: String,
        required: function() { return this.parent().productFor === "Exchange"; },
      },
      claimTill: {
        type: Date,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Accepted", "Rejected", "Expired"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      // Enhanced offer tracking
      responseMessage: {
        type: String,
      },
      respondedAt: {
        type: Date,
      },
    }],
    claims: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      claimTill: {
        type: Date,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Accepted", "Rejected", "Expired"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      // Enhanced claim tracking
      responseMessage: {
        type: String,
      },
      respondedAt: {
        type: Date,
      },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
