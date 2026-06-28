'use client';
import * as React from 'react';

const FALLBACK_STATUS = {
	PLAYING: 'PLAYING',
	STOPPED: 'STOPPED',
} as const;

type SoundPlayerProps = {
	src: string;
	play?: boolean;
	loop?: boolean;
	volume?: number;
	onFinishedPlaying?: () => void;
};

export default function SoundPlayer({
	src,
	play = true,
	loop = false,
	volume = 100,
	onFinishedPlaying,
}: SoundPlayerProps) {
	const ReactSoundModule = React.useMemo(() => {
		if (typeof window === 'undefined') {
			return null;
		}

		try {
			return require('react-sound');
		} catch {
			return null;
		}
	}, []);

	if (!ReactSoundModule) {
		return null;
	}

	const ReactSound = ReactSoundModule?.default ?? ReactSoundModule;
	const SoundStatus = ReactSoundModule?.status
		?? ReactSound?.status
		?? FALLBACK_STATUS;

	const safeVolume = Math.max(0, Math.min(100, volume));

	return (
		<ReactSound
			url={src}
			playStatus={play ? SoundStatus.PLAYING : SoundStatus.STOPPED}
			loop={loop}
			volume={safeVolume}
			onFinishedPlaying={onFinishedPlaying}
		/>
	);
}
