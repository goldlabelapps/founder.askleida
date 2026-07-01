'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MightyButton } from '../../../NX/DesignSystem';
import type { MightyButtonProps } from '../../types.d';

type BackButtonProps = Omit<Extract<MightyButtonProps, { kind?: 'button' }>, 'children' | 'startIcon'> & {
	kind?: 'button';
};

type BackIconProps = Omit<Extract<MightyButtonProps, { kind: 'icon' }>, 'children'>;

type BackProps = (BackButtonProps | BackIconProps) & {
	label?: React.ReactNode;
	onClick?: React.MouseEventHandler<HTMLElement>;
};

const Back = ({
	label = 'Back',
	onClick,
	...props
}: BackProps) => {
	const router = useRouter();
	const isIconKind = props.kind === 'icon';

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if (onClick) {
			onClick(event);
			return;
		}

		router.back();
	};

	if (isIconKind) {
		const { kind, icon, ...restIconProps } = props as BackIconProps;

		return (
			<MightyButton
				kind="icon"
				{...restIconProps}
				icon={icon || 'left'}
				onClick={handleClick}
			/>
		);
	}

	const { kind, ...restButtonProps } = props as BackButtonProps;

	return (
		<MightyButton
			kind="button"
			{...restButtonProps}
			startIcon="left"
			variant={restButtonProps.variant || 'text'}
			onClick={handleClick}
		>
			{label}
		</MightyButton>
	);
};

export default Back;