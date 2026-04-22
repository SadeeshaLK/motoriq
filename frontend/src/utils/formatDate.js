export const formatRelativeDate = (date) => {
  if (!date) return "";
  const now = new Date();
  const posted = new Date(date);
  const diffInSeconds = Math.floor((now - posted) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return posted.toLocaleDateString();
};
