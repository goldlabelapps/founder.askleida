import React from 'react';
import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Typography,
} from '@mui/material';
import { Icon } from '../../../../DesignSystem'

type I_DashCard = {
	title: string;
	description: string;
	icon: string;
	cta: () => void;
};

const DashCard = ({ 
    title, 
    description, 
    icon, 
    cta }: I_DashCard) => {
	return (
		<Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<CardContent sx={{ flexGrow: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Icon icon={icon as any} />
					</Box>
					<Typography variant="h6" component="h3">
						{title}
					</Typography>
				</Box>

				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			</CardContent>

			<CardActions>
				<Box sx={{ flexGrow: 1 }} />
				<Button 
					onClick={cta}
                    endIcon={<Icon icon="right" />}
                    variant="outlined"
                >
					Go
				</Button>
			</CardActions>
		</Card>
	);
};

export default DashCard;
