"use client";
import React from 'react';
import LeidaL from './LeidaL';
import LeidaE from './LeidaE';
import LeidaI from './LeidaI';
import LeidaIDot from './LeidaIDot';
import LeidaD from './LeidaD';
import LeidaA from './LeidaA';

const clipStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
};

const LeidaLogo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        const { style, ...rest } = props;
        return (
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    margin: '0 auto',
                    ...(style || {})
                }}
                ref={ref}
                {...rest}
            >
                <LeidaL style={clipStyle} aria-hidden="true" focusable="false" />
                <LeidaE style={clipStyle} aria-hidden="true" focusable="false" />
                <LeidaI style={clipStyle} aria-hidden="true" focusable="false" />
                <LeidaIDot style={clipStyle} aria-hidden="true" focusable="false" />
                <LeidaD style={clipStyle} aria-hidden="true" focusable="false" />
                <LeidaA style={clipStyle} aria-hidden="true" focusable="false" />
            </div>
        );
    });

export default LeidaLogo;
