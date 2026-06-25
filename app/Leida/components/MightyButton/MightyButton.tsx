'use client';

import * as React from 'react';
import {
	Button,
	Fab,
	IconButton,
	ListItemButton,
	ListItemIcon,
} from '@mui/material';
import type {
	ButtonProps,
	FabProps,
	IconButtonProps,
	ListItemButtonProps,
} from '@mui/material';
import type { I_Icon } from '../../../NX/types';
import Icon from '../../../NX/DesignSystem/components/Icon';

export type MightyButtonKind = 'button' | 'icon' | 'fab' | 'listItem';

export type MightyButtonProps = Partial<ButtonProps> &
	Partial<FabProps> &
	Partial<IconButtonProps> &
	Partial<ListItemButtonProps> & {
	kind?: MightyButtonKind;
	icon?: React.ReactElement | I_Icon['icon'];
	onClick?: React.MouseEventHandler<HTMLElement>;
	children?: React.ReactNode;
};

const renderIcon = (icon: MightyButtonProps['icon']) => {
	if (!icon) return null;
	if (React.isValidElement(icon)) return icon;

	return <Icon icon={icon} />;
};

const MightyButton = ({
	kind = 'button',
	icon,
	onClick,
	children,
	startIcon,
	endIcon,
	...props
}: MightyButtonProps) => {
	const resolvedIcon = renderIcon(icon);

	if (kind === 'icon') {
		const iconButtonProps = props as IconButtonProps;

		return (
			<IconButton {...iconButtonProps} onClick={onClick}>
				{resolvedIcon || children}
			</IconButton>
		);
	}

	if (kind === 'fab') {
		const fabProps = props as FabProps;

		return (
			<Fab {...fabProps} onClick={onClick}>
				{resolvedIcon || children}
			</Fab>
		);
	}

	if (kind === 'listItem') {
		const listItemButtonProps = props as ListItemButtonProps;

		return (
			<ListItemButton {...listItemButtonProps} onClick={onClick}>
				{resolvedIcon ? <ListItemIcon sx={{ minWidth: 40 }}>{resolvedIcon}</ListItemIcon> : null}
				{children}
			</ListItemButton>
		);
	}

	const buttonProps = props as ButtonProps;
	const resolvedStartIcon = startIcon ?? (resolvedIcon && !endIcon ? resolvedIcon : undefined);

	return (
		<Button
			{...buttonProps}
			onClick={onClick}
			startIcon={resolvedStartIcon}
			endIcon={endIcon}
		>
			{children}
		</Button>
	);
};

export default MightyButton;
