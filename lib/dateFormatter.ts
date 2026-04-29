export function formatDate(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return "Invalid date";
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = dateObj.toDateString() === today.toDateString();
    const isYesterday = dateObj.toDateString() === yesterday.toDateString();

    if (isToday) {
        return dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } else if (isYesterday) {
        return "Yesterday";
    } else if (dateObj.getFullYear() === today.getFullYear()) {
        return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    } else {
        return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
}
