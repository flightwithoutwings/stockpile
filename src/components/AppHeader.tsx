
import type React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Blocks, Upload, PackagePlus, FileJson, ChevronDown } from 'lucide-react';

export type ExportType = 'url_only' | 'uri_only' | 'both';

interface AppHeaderProps {
  onAddItemClick: () => void;
  onExportClick: (type: ExportType) => void;
  onRestoreClick: () => void;
  onImportJsonItemClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onAddItemClick, onExportClick, onRestoreClick, onImportJsonItemClick }) => {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blocks className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Stockpile</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onImportJsonItemClick}>
            <FileJson className="mr-2 h-4 w-4" />
            Add from JSON
          </Button>
          <Button variant="outline" onClick={onRestoreClick}>
            <Upload className="mr-2 h-4 w-4" />
            Restore
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Export Data
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExportClick('url_only')}>
                URL only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportClick('uri_only')}>
                Uploaded Images only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportClick('both')}>
                URL & Uploaded Images
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onAddItemClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PackagePlus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

    