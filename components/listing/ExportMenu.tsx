'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
        >
          <Download size={14} />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>Export as PDF</DropdownMenuItem>
        <DropdownMenuItem>Athome.lu format</DropdownMenuItem>
        <DropdownMenuItem>ImmoTop.lu format</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
