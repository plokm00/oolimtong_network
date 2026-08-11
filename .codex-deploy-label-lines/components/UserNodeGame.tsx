import React from 'react';
import { UserNode } from '@/lib/user-node-data';
import { UserNodeGameUI } from './UserNodeGameUI';

interface UserNodeGameProps {
    node: UserNode | null;
    user: any;
    userNodes: UserNode[];
    onClose: () => void;
    isMobile: boolean;
    onSwitchToMainstream?: () => void;
}

export const UserNodeGame: React.FC<UserNodeGameProps> = (props) => {
    return (
        <UserNodeGameUI
            {...props}
        />
    );
};
