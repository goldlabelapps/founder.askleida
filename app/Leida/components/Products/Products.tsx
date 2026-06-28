'use client';

import * as React from 'react';
import {
	Card,
	CardContent,
	Box,
	Stack,
	List,
	ListItem,
	ListItemText,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import {
	setLeida,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();

	React.useEffect(() => {
			dispatch(setLeida('header', {
				title: 'Products',
				icon: 'products',
			}));
	}, [dispatch]);

	return (
		<Box sx={{ p: 2 }}>
			<Stack spacing={2}>

				<Card variant="outlined">
					<CardContent>


						<Typography>
							This area is the founder-facing summary of how AWIN products move from raw feed rows to curated products used across Leida and public UI. Think of it like this; Awin = triage raw feed. Queue = staging and decisions. Products = curated records for real app usage.
						</Typography>

						<List dense sx={{ py: 0, listStyleType: 'disc', pl: 3, '& .MuiListItem-root': { display: 'list-item', py: 0.25 } }}>
							<ListItem disablePadding>
								<ListItemText primary="GET /api/awin: search and page raw AWIN source rows." />
							</ListItem>
							<ListItem disablePadding>
								<ListItemText primary="POST /api/awin/lookfantastic/queue: queue or delete decisions." />
							</ListItem>
							<ListItem disablePadding>
								<ListItemText primary="GET /api/products/queue: inspect pending/processed queue items." />
							</ListItem>
							<ListItem disablePadding>
								<ListItemText primary="GET /api/products: browse processed products." />
							</ListItem>
							<ListItem disablePadding>
								<ListItemText primary="DELETE /api/products: bulk-remove processed products." />
							</ListItem>
						</List>
					</CardContent>
					
				</Card>
				
			</Stack>
		</Box>
	);
}
