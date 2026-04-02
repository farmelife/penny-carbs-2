import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, UserX, UserCheck } from 'lucide-react';

interface UsersTableActionsProps {
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const UsersTableActions: React.FC<UsersTableActionsProps> = ({
  isActive,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(); }}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleActive(); }}>
          {isActive ? (
            <>
              <UserX className="mr-2 h-4 w-4" />
              Mark Inactive
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Mark Active
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(); }} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UsersTableActions;
