import Review from "../models/Review.js"

export const createReview = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.create({
      vehicle: vehicleId,
      user: req.user.id,
      rating,
      comment
    });

    // Populate user so stringified ID doesn't break the frontend name display
    const populatedReview = await Review.findById(review._id).populate("user", "name");

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: "Failed to create review" });
  }
};

export const getVehicleReviews = async (req, res) => {

  try {

    const reviews = await Review.find({
      vehicle: req.params.vehicleId
    }).populate("user", "name")

    res.json(reviews)

  } catch (error) {

    res.status(500).json({ message: "Failed to fetch reviews" })

  }

}
