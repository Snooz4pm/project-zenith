'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface CommunityTileProps {
    onClick: () => void;
}

interface Notification {
    type: 'mention' | 'like' | 'follow' | 'comment';
    message: string;
}

export default function CommunityTile({ onClick }: CommunityTileProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(3);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/community/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications?.slice(0, 2) || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (error) {
                // Use mock data
                setNotifications([
                    { type: 'mention', message: '@joe: "Nice trade!"' },
                    { type: 'like', message: '2 likes on your post' },
                ]);
                setUnreadCount(3);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <div className={`${styles.tile} ${styles.tileMedium}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>👥</span>
                    <span className={styles.tileName}>Social</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <div className={styles.statValue}>
                    🔔 {unreadCount} new
                </div>
                <div className={styles.notificationList}>
                    {notifications.map((notif, idx) => (
                        <div key={idx} className={styles.notificationItem}>
                            <span className={styles.notificationDot} />
                            <span>{notif.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
