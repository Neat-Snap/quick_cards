export function botUsername(start?: string): string {
    const startParam = start ? start : '{}';
    return `https://t.me/face_cards_bot?start=${startParam}`;
}