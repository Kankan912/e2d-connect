import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonGlobalProps {
  to?: string;
  fallbackPath?: string;
}

export default function BackButtonGlobal({ to, fallbackPath = "/" }: BackButtonGlobalProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleBack}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      Retour
    </Button>
  );
}