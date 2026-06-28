import React from 'react';
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	Typography,
} from '@mui/material';
import { Icon } from '../../../../NX/DesignSystem'
import type { I_DashCard } from '../../../types.d';

const DashCard = ({ 
    title, 
    description, 
    icon, 
    cta }: I_DashCard) => {
	return (
		<Card 
			variant='outlined' 
			sx={{ 
				height: '100%', 
				display: 'flex', 
				flexDirection: 'column' 
			}}>
			<CardActionArea onClick={cta} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
				<CardContent sx={{ flexGrow: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Icon icon={icon as any} />
						</Box>
						<Typography variant="h6">
							{title}
						</Typography>
					</Box>

					{description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export default DashCard;
