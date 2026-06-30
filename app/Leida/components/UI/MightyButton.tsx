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
import {Icon} from '../../../NX/DesignSystem';
import type { MightyButtonProps } from '../../types.d';

const renderIcon = (icon: MightyButtonProps['icon']) => {
	if (!icon) return null;
	if (React.isValidElement(icon)) return icon;

	return <Icon icon={icon} color="primary" />;
};

const renderNamedIcon = (icon?: MightyButtonProps['startIcon']) => (icon ? <Icon icon={icon} /> : undefined);

const MightyButton = ({
	kind = 'button',
	icon,
	onClick,
	children,
	startIcon,
	endIcon,
	alignLeft,
	size = 'large',
	...props
}: MightyButtonProps) => {
	const resolvedIcon = renderIcon(icon);
	const resolvedStartIcon = renderNamedIcon(startIcon) ?? (resolvedIcon && !endIcon ? resolvedIcon : undefined);
	const resolvedEndIcon = renderNamedIcon(endIcon);

	if (kind === 'icon') {
		const iconButtonProps = props as IconButtonProps;

		return (
			<IconButton {...iconButtonProps} size={size} onClick={onClick}>
				{resolvedIcon || children}
			</IconButton>
		);
	}

	if (kind === 'fab') {
		const fabProps = props as FabProps;

		return (
			<Fab {...fabProps} size={size} onClick={onClick}>
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
	const buttonSx = Array.isArray(buttonProps.sx)
		? buttonProps.sx
		: buttonProps.sx
			? [buttonProps.sx]
			: [];
	const resolvedButtonSx = alignLeft && buttonProps.fullWidth
		? [
			...buttonSx,
			{
				justifyContent: 'flex-start',
				textAlign: 'left',
			},
		]
		: buttonSx;

	return (
		<Button
			{...buttonProps}
			sx={resolvedButtonSx}
			size={size}
			onClick={onClick}
			startIcon={resolvedStartIcon}
			endIcon={resolvedEndIcon}
		>
			{children}
		</Button>
	);
};

export default MightyButton;