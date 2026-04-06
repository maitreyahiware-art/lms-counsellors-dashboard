export interface SocialPost {
    id: number;
    title: string;
    description?: string;
    postType: string;
    postSubType: string;
    tags?: string;
    postLink: string;
    videoId?: string;
    last_used_date?: string;
}

export function extractYoutubeId(url: any): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : undefined;
}

export async function fetchSocialPosts(): Promise<SocialPost[]> {
    try {
        const response = await fetch('https://bn-new-api.balancenutritiononline.com/api/v1/social-posts/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        const root = Array.isArray(data) ? data[0] : data;
        
        if (root.status === 'success' && root.data) {
            const rawRecords = Array.isArray(root.data) ? root.data : root.data[0]?.records;
            const records = (rawRecords || []).map((r: any) => ({
                ...r,
                videoId: r.videoId || extractYoutubeId(r.postLink)
            }));
            return records;
        }
        return [];
    } catch (e) {
        console.error('BN CRM API Error:', e);
        return [];
    }
}
