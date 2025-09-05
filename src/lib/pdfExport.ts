import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoE2D from '@/assets/logo-e2d.png';

export interface ExportColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ExportOptions {
  title: string;
  filename?: string;
  columns: ExportColumn[];
  data: any[];
  orientation?: 'portrait' | 'landscape';
  includeDate?: boolean;
  includeStats?: boolean;
}

export const exportToPDF = (options: ExportOptions): void => {
  const {
    title,
    filename = `${title}_${new Date().toISOString().split('T')[0]}.pdf`,
    columns,
    data,
    orientation = 'portrait',
    includeDate = true,
    includeStats = false
  } = options;

  const pdf = new jsPDF(orientation, 'mm', 'a4');
  
  // Logo
  try {
    pdf.addImage(logoE2D, 'PNG', 15, 10, 20, 20);
  } catch (error) {
    console.log('Erreur chargement logo:', error);
  }
  
  // En-tête
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 40, 20);
  
  // Association
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Association E2D', 40, 30);
  
  if (includeDate) {
    pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 15, 40);
  }
  
  let yPosition = includeDate ? 50 : 40;
  
  // Statistiques rapides si demandées
  if (includeStats && data.length > 0) {
    pdf.setFontSize(10);
    pdf.text(`Total d'enregistrements: ${data.length}`, 15, yPosition);
    yPosition += 10;
  }
  
  // Tableau principal
  autoTable(pdf, {
    head: [columns.map(col => col.header)],
    body: data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (typeof value === 'number' && col.dataKey.includes('montant')) {
          return `${value.toLocaleString('fr-FR')} FCFA`;
        }
        if (value instanceof Date) {
          return value.toLocaleDateString('fr-FR');
        }
        return value?.toString() || '';
      })
    ),
    startY: yPosition,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Bleu primary
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      if (col.dataKey.includes('montant')) {
        acc[index] = { ...acc[index], halign: 'right' };
      }
      return acc;
    }, {} as any),
    margin: { top: yPosition, left: 15, right: 15 }
  });
  
  // Pied de page
  const pageCount = (pdf as any).internal.getNumberOfPages();
  pdf.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleString('fr-FR')}`,
      15,
      (pdf as any).internal.pageSize.height - 10
    );
  }
  
  // Téléchargement
  pdf.save(filename);
};

// Exports spécialisés
export const exportMembersToPDF = (membres: any[]) => {
  exportToPDF({
    title: 'Liste des Membres',
    filename: `membres_${new Date().toISOString().split('T')[0]}.pdf`,
    columns: [
      { header: 'Nom', dataKey: 'nom', width: 30 },
      { header: 'Prénom', dataKey: 'prenom', width: 30 },
      { header: 'Email', dataKey: 'email', width: 50 },
      { header: 'Téléphone', dataKey: 'telephone', width: 25 },
      { header: 'Statut', dataKey: 'statut', width: 20 },
      { header: 'Date inscription', dataKey: 'date_inscription', width: 25 }
    ],
    data: membres,
    includeStats: true
  });
};

export const exportCotisationsToPDF = (cotisations: any[]) => {
  exportToPDF({
    title: 'Rapport des Cotisations',
    filename: `cotisations_${new Date().toISOString().split('T')[0]}.pdf`,
    columns: [
      { header: 'Membre', dataKey: 'membre_nom', width: 40 },
      { header: 'Type', dataKey: 'type_nom', width: 30 },
      { header: 'Montant', dataKey: 'montant', width: 25 },
      { header: 'Date paiement', dataKey: 'date_paiement', width: 25 },
      { header: 'Statut', dataKey: 'statut', width: 20 }
    ],
    data: cotisations,
    includeStats: true
  });
};

export const exportPretsToPDF = (prets: any[]) => {
  exportToPDF({
    title: 'Rapport des Prêts',
    filename: `prets_${new Date().toISOString().split('T')[0]}.pdf`,
    columns: [
      { header: 'Membre', dataKey: 'membre_nom', width: 35 },
      { header: 'Montant', dataKey: 'montant', width: 25 },
      { header: 'Taux', dataKey: 'taux_interet', width: 15 },
      { header: 'Date prêt', dataKey: 'date_pret', width: 25 },
      { header: 'Échéance', dataKey: 'echeance', width: 25 },
      { header: 'Statut', dataKey: 'statut', width: 20 }
    ],
    data: prets,
    orientation: 'landscape',
    includeStats: true
  });
};

export const exportAidesToPDF = (aides: any[]) => {
  exportToPDF({
    title: 'Rapport des Aides',
    filename: `aides_${new Date().toISOString().split('T')[0]}.pdf`,
    columns: [
      { header: 'Bénéficiaire', dataKey: 'beneficiaire_nom', width: 40 },
      { header: 'Type aide', dataKey: 'type_nom', width: 30 },
      { header: 'Montant', dataKey: 'montant', width: 25 },
      { header: 'Date allocation', dataKey: 'date_allocation', width: 25 },
      { header: 'Statut', dataKey: 'statut', width: 20 }
    ],
    data: aides,
    includeStats: true
  });
};