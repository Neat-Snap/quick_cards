export function botUsername(start?: string): string {
    const startParam = start ? start : '{}';
    return `https://t.me/quick_business_bot?start=${startParam}`;
}