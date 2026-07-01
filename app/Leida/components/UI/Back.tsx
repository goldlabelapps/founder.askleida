'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MightyButton } from '../../../NX/DesignSystem';
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
	const isIconKind = props.kind === 'icon';

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
			{...(isIconKind
				? { icon: props.icon || 'left' }
				: { startIcon: 'left', variant })}
			onClick={handleClick}
		>
			{isIconKind ? null : label}
		</MightyButton>
	);
};

export default Back;