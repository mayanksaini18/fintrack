'use client';

import { useFinanceStore } from '@/lib/store';
import { Role } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Shield, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoleSwitcher() {
  const { role, setRole } = useFinanceStore();
  const isAdmin = role === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md px-2.5"
          >
            {isAdmin ? (
              <Shield className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {isAdmin ? 'Admin' : 'Viewer'}
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setRole('admin' as Role)}
          className={cn('gap-2 cursor-pointer text-xs', isAdmin && 'font-semibold')}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRole('viewer' as Role)}
          className={cn('gap-2 cursor-pointer text-xs', !isAdmin && 'font-semibold')}
        >
          <Eye className="w-3.5 h-3.5" />
          Viewer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
