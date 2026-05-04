export const getRecommendation = (rating) => {
  const num = parseFloat(rating);
  if (num >= 8.0) return "good";
  if (num <= 5.0) return "bad";
  return "neutral";
};