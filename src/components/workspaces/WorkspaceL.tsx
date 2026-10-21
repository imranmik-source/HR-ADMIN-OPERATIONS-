import React from 'react';
import { WorkspaceA } from './WorkspaceA.tsx';
import { UserProfile } from '../../types/index.ts';

interface WorkspaceLProps {
  currentUser: UserProfile;
}

/**
 * Workspace L – Service Vendor Master shortcut
 * Shares the exact same Vendor Master dataset from Workspace A Tab 2 without duplication.
 */
export function WorkspaceL({ currentUser }: WorkspaceLProps) {
  return <WorkspaceA currentUser={currentUser} initialTab="vendors" />;
}
