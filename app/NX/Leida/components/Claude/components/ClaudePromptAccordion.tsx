'use client';
import * as React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface I_ClaudePromptAccordion {
    title: string;
    content: string;
    defaultExpanded?: boolean;
}

export default function ClaudePromptAccordion({
    title,
    content,
    defaultExpanded = false,
}: I_ClaudePromptAccordion) {
    return (
        <Accordion defaultExpanded={defaultExpanded}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <pre>
                    {content}
                </pre>
            </AccordionDetails>
        </Accordion>
    );
}