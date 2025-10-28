import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TableauBordDirectionSimple } from '@/components/TableauBordDirectionSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard Global
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des indicateurs clés de performance de l'association
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard')} className="w-full md:w-auto">
            Accéder au Dashboard Global
          </Button>
        </CardContent>
      </Card>
      
      <TableauBordDirectionSimple />
    </div>
  );
}

