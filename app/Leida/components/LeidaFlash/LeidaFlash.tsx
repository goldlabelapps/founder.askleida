"use client";
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from '../../../NX/Uberedux';
import {
    Flash,
    MovieClip,
} from '../../../../app/NX/Flash';
import {
    setLeida,
    useLeida,
    useDash,
} from '../../../Leida';

import {
    LeidaFlashAS,
    LeidaLogo,
} from '.';

export const LeidaFlash: React.FC = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const leida = useLeida();
    const dash = useDash();
    const logoRef = useRef<HTMLDivElement>(null);
    const as = useRef<LeidaFlashAS | null>(null);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Flash',
                icon: 'flash',
            }));
        }
    }, [dispatch, dash?.title]);

    useEffect(() => {
        const initActionScript = () => {
            as.current = new LeidaFlashAS(undefined, logoRef as React.RefObject<any>);
            as.current.init();
        };

        initActionScript();

        return () => {
            if (as.current && typeof as.current.destroy === 'function') {
                as.current.destroy();
            }
        };
    }, []);

    

    return (
            <Flash id={'leida_flash'} width={"100%"} height={350}>
                <MovieClip
                    id='mc_logo'
                    width={300}
                    height={100}
                    maxWidth={'90%'}
                    zIndex={100}>
                    <LeidaLogo ref={logoRef} />
                </MovieClip>
                
            </Flash>
    );
};
