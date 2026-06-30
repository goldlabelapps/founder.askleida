'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import MightyButton from './MightyButton';
import type { MightyButtonProps } from '../../types.d';

type BackProps = Omit<MightyButtonProps, 'children' | 'startIcon'> & {
	label?: React.ReactNode;
};

const Back = ({
	label = 'Back',
	onClick,
	variant = 'text',
	...props
}: BackProps) => {
	const router = useRouter();

	const handleClick: MightyButtonProps['onClick'] = (event) => {
		if (onClick) {
			onClick(event);
			return;
		}

		router.back();
	};

	return (
		<MightyButton
			{...props}
			startIcon="left"
			variant={variant}
			onClick={handleClick}
		>
			{label}
		</MightyButton>
	);
};

export default Back;