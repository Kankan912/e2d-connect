import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CotisationForm from './CotisationForm';

interface CotisationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: any;
}

export default function CotisationFormModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialData 
}: CotisationFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Modifier' : 'Nouvelle'} Cotisation
          </DialogTitle>
        </DialogHeader>
        <CotisationForm 
          initialData={initialData}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}