import React from 'react';
import styles from './lib/Flash.module.css';

export interface I_Flash {
    id?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    width?: number | string;
    height?: number | string;
}

export const Flash: React.FC<I_Flash> = ({
    children,
    id,
    style,
    className,
    width = '600',
    height = '400',
}) => {
    return (
        <div
            id={id}
            className={[styles.FlashStage, className].filter(Boolean).join(' ')}
            style={{ width, height, ...style }}
        >
            {children}
        </div>
    );
};

export default Flash;
