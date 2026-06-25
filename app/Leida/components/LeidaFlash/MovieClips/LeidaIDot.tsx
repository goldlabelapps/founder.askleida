import React from 'react';
import { LEIDA_GROUP_TRANSFORM, LEIDA_VIEW_BOX, LEIDA_DOT_PATH } from './leidaLogoData';

export default function LeidaIDot(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox={LEIDA_VIEW_BOX} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" {...props}>
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g transform={LEIDA_GROUP_TRANSFORM}>
                    <path d={LEIDA_DOT_PATH} fill="#8734AB"></path>
                </g>
            </g>
        </svg>
    );
}
