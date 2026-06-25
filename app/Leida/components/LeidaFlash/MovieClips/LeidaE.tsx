import React from 'react';
import { LEIDA_GROUP_TRANSFORM, LEIDA_VIEW_BOX, LEIDA_MAIN_PATH } from './leidaLogoData';

export default function LeidaE(props: React.SVGProps<SVGSVGElement>) {
    const clipId = React.useId();

    return (
        <svg viewBox={LEIDA_VIEW_BOX} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" {...props}>
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g transform={LEIDA_GROUP_TRANSFORM}>
                    <clipPath id={clipId}>
                        <rect x="430" y="150" width="290" height="260" />
                    </clipPath>
                    <path d={LEIDA_MAIN_PATH} fill="#052841" clipPath={`url(#${clipId})`}></path>
                </g>
            </g>
        </svg>
    );
}
