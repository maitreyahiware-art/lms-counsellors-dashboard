"use client";

import { useEffect, useRef, useState } from 'react';
import { logActivity } from '@/lib/activity';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    onComplete: () => void;
    topicCode?: string;
    topicTitle?: string;
}

export default function YouTubePlayer({ videoId, onComplete, topicCode, topicTitle }: YouTubePlayerProps) {
    const playerRef = useRef<any>(null);
    const [instanceId] = useState(() => `yt-player-${Math.random().toString(36).substr(2, 9)}`);
    const containerId = instanceId;

    // Handle cross-player auto-pause
    useEffect(() => {
        const handleGlobalPlay = (e: any) => {
            if (e.detail?.id !== instanceId && playerRef.current) {
                try {
                    if (playerRef.current.getPlayerState() === 1) {
                        playerRef.current.pauseVideo();
                    }
                } catch (err) { /* ignore */ }
            }
        };

        window.addEventListener('video-playing', handleGlobalPlay);
        return () => window.removeEventListener('video-playing', handleGlobalPlay);
    }, [instanceId]);

    useEffect(() => {
        let isMounted = true;

        const checkYoutubeApi = () => {
            if (window.YT && window.YT.Player) {
                if (playerRef.current) {
                    // Update existing player
                    if (playerRef.current.cueVideoById) {
                        playerRef.current.cueVideoById(videoId);
                    }
                } else {
                    createPlayer();
                }
                return true;
            }
            return false;
        };

        if (!checkYoutubeApi()) {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            }

            const interval = setInterval(() => {
                if (checkYoutubeApi()) {
                    clearInterval(interval);
                }
            }, 100);

            const originalCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (originalCallback) originalCallback();
                if (isMounted) checkYoutubeApi();
            };

            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        }

        function createPlayer() {
            if (!isMounted) return;
            const container = document.getElementById(containerId);
            if (!container || playerRef.current || !window.YT || !window.YT.Player) return;

            try {
                playerRef.current = new window.YT.Player(containerId, {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        'playsinline': 1,
                        'modestbranding': 1,
                        'rel': 0,
                        'autoplay': 0
                    },
                    events: {
                        'onStateChange': onPlayerStateChange
                    }
                });
            } catch (err) {
                console.error("Failed to create YouTube player:", err);
            }
        }

        function onPlayerStateChange(event: any) {
            // YT.PlayerState.PLAYING is 1
            if (event.data === 1) {
                window.dispatchEvent(new CustomEvent('video-playing', { detail: { id: instanceId } }));
                logActivity('watch_video', { topicCode, contentTitle: topicTitle || 'Video Started' });
            }
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
                onComplete();
                logActivity('watch_video', { topicCode, contentTitle: `${topicTitle || 'Video'} Completed` });
            }
        }

        return () => {
            isMounted = false;
        };
    }, [videoId, onComplete, topicCode, topicTitle]);

    useEffect(() => {
        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
            <div id={containerId} className="w-full h-full"></div>
        </div>
    );
}

