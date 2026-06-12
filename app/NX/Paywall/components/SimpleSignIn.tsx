"use client";
import React, { useState } from 'react';
import { 
    Box,
    Collapse,
    IconButton,
    Button, 
    TextField, 
    Typography, 
    InputAdornment,
    Avatar,
    CardHeader
} from '@mui/material';
import { Icon } from '../../DesignSystem';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from '../../Uberedux';
import type { T_Config } from '../../types';
import { login } from '../../Paywall';

export default function SimpleSignIn({ config }: { config?: T_Config }) {
    
    const dispatch = useDispatch();
    const currentThemeMode = useTheme().palette.mode as 'light' | 'dark';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    function isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    const isFormValid = isValidEmail(email) && password.length >= 6;

    const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault();
        if (isFormValid) dispatch(login(email, password));
    };

    return (
        <form onSubmit={handleSubmit}>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img src={`/nxadmin/svg/logo-${currentThemeMode === 'dark' ? 'light' : 'dark'}.svg`} alt="Logo" style={{ height: 48 }} />
            </Box>
            
            <Box sx={{}}>
                <TextField
                    autoFocus
                    label="Email"
                    variant='outlined'
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Password"
                    variant='outlined'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword((show) => !show)}
                                    edge="end"
                                >
                                    <Icon icon={showPassword ? 'hide' : 'show'} />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            handleSubmit(e);
                        }
                    }}
                />
                <Collapse in={isFormValid}>
                    <Box sx={{my:2}}>
                        <Button
                            type="submit"
                            fullWidth
                            endIcon={<Icon icon="signin" />}
                            variant={"contained"}
                            sx={{ mt: 0 }}
                            onClick={handleSubmit}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Collapse>
            </Box>

            <Typography sx={{ my: 1 }} color="primary">
                {error}
            </Typography>

        </form>
    );
}


