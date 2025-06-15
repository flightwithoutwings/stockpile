
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Blocks, Download, PackagePlus, Upload, FileJson } from 'lucide-react';

interface AppHeaderProps {
  onAddItemClick: () => void;
  onBackupClick: () => void;
  onRestoreClick: () => void;
  onImportJsonItemClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onAddItemClick, onBackupClick, onRestoreClick, onImportJsonItemClick }) => {
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
            Restore Data
          </Button>
          <Button variant="outline" onClick={onBackupClick}>
            <Download className="mr-2 h-4 w-4" />
            Backup Data
          </Button>
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
