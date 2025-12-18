const router = require("express").Router();
const Ad = require("../models/Ad");

// GET /api/ads - Get active ads for public display
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const ads = await Ad.find({
      status: "Active",
      validFrom: { $lte: now },
      validTill: { $gte: now }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(10)
    .select("-createdBy -clickCount -impressionCount")
    .lean();

    // Track impressions for these ads
    const adIds = ads.map(ad => ad._id);
    if (adIds.length > 0) {
      await Ad.updateMany(
        { _id: { $in: adIds } },
        { $inc: { impressionCount: 1 } }
      );
    }

    res.status(200).json(ads);
  } catch (err) {
    console.error("Get public ads error:", err);
    res.status(500).json(err);
  }
});

// PUT /api/ads/:id/click - Track ad click (public)
router.put("/:id/click", async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.status(200).json("Click tracked");
  } catch (err) {
    console.error("Track click error:", err);
    res.status(500).json(err);
  }
});

module.exports = router;