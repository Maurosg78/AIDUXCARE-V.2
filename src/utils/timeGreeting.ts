/**
 * WO-PILOT-FIX-07: Time-based greeting for workflow header
 * Returns appropriate greeting based on local time
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 18) {
    return "Good afternoon";
  } else if (hour >= 18 && hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
  }
}
