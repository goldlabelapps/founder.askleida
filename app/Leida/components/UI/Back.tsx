'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import MightyButton from './MightyButton';
import type { MightyButtonProps } from '../../types.d';

type BackProps = Omit<Extract<MightyButtonProps, { kind?: 'button' }>, 'children' | 'startIcon'> & {
	label?: React.ReactNode;
};

const Back = ({
	label = 'Back',
	onClick,
	variant = 'text',
	...props
}: BackProps) => {
	const router = useRouter();

	const handleClick: NonNullable<BackProps['onClick']> = (event) => {
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