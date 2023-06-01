import {Box, Drawer, IconButton, Typography} from '@mui/material';
import {Close as CloseIcon} from '@mui/icons-material';
import React from "react";

type ItemProps = {
    isOpen: boolean;
    onClose: { (): void }
    children: React.ReactNode,
    title: string
};


const InfoDrawer = ({ isOpen, onClose, children, title } :ItemProps) => {
    return (
        <Drawer anchor="right" open={isOpen} onClose={onClose} PaperProps={{
            sx: { minWidth: "75%" },
        }}>
            <div className="flex flex-col h-full p-4 w-50">
                <div className="flex-grow">

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row'  }}>
                        <Typography variant="h5">{title}</Typography>
                        <Box>
                            <IconButton onClick={onClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    {children}

                </div>
            </div>
        </Drawer>
    );
};

export default InfoDrawer;