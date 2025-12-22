'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface NotesTileProps {
    onClick: () => void;
}

export default function NotesTile({ onClick }: NotesTileProps) {
    const [lastNote, setLastNote] = useState('Watch TSLA support at $248...');
    const [lastNoteTime, setLastNoteTime] = useState('3h ago');

    useEffect(() => {
        // In production, fetch from localStorage or API
        const savedNote = localStorage.getItem('zenith_last_note');
        const savedTime = localStorage.getItem('zenith_last_note_time');
        if (savedNote) setLastNote(savedNote);
        if (savedTime) setLastNoteTime(savedTime);
    }, []);

    const handleAddNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <div className={`${styles.tile} ${styles.tileWide}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>📝</span>
                    <span className={styles.tileName}>Notes</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                {lastNote ? (
                    <>
                        <div className={styles.notePreview}>"{lastNote}"</div>
                        <div className={styles.noteTime}>Last note: {lastNoteTime}</div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📝</span>
                        <span>No notes yet</span>
                    </div>
                )}
                <button className={styles.addNoteBtn} onClick={handleAddNote}>
                    + Add Note
                </button>
            </div>
        </div>
    );
}
