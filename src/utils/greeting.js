// Time-based greeting using the device's local time (so it follows the user's time zone).
export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 16) return 'Good afternoon';
  if (hour >= 17 && hour <= 20) return 'Good evening';
  return 'Burning the midnight oil';
};
