import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  title: string;
  data: any[];
  columns: ExportColumn[];
  metadata?: {
    author?: string;
    dateGeneration?: Date;
    periode?: string;
    association?: string;
  };
  styles?: {
    logoUrl?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  stats?: Array<{ label: string; value: string | number }>;
  includeGraphics?: boolean;
}

export class ExportService {
  private static readonly DEFAULT_LOGO = '/lovable-uploads/c1efd290-dcb8-44ad-bd52-81f65f2cb640.png';
  private static readonly DEFAULT_ASSOCIATION = 'Association E2D';
  private static readonly DEFAULT_COLOR = '#1e40af';

  static async exportToPDF(options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header avec logo
    try {
      const logoUrl = options.styles?.logoUrl || this.DEFAULT_LOGO;
      doc.addImage(logoUrl, 'PNG', 14, 10, 30, 30);
    } catch (error) {
      console.error('Erreur chargement logo:', error);
    }

    // Titre et informations
    doc.setFontSize(18);
    doc.setTextColor(options.styles?.primaryColor || this.DEFAULT_COLOR);
    doc.text(options.title, pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      options.metadata?.association || this.DEFAULT_ASSOCIATION,
      pageWidth / 2,
      32,
      { align: 'center' }
    );

    const dateStr = new Date(options.metadata?.dateGeneration || new Date()).toLocaleDateString('fr-FR');
    doc.text(`Généré le ${dateStr}`, pageWidth / 2, 38, { align: 'center' });

    if (options.metadata?.periode) {
      doc.text(`Période: ${options.metadata.periode}`, pageWidth / 2, 44, { align: 'center' });
    }

    let yPos = 50;

    // Statistiques si présentes
    if (options.stats && options.stats.length > 0) {
      yPos += 5;
      doc.setFontSize(12);
      doc.setTextColor(options.styles?.primaryColor || this.DEFAULT_COLOR);
      doc.text('Statistiques', 14, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      options.stats.forEach((stat) => {
        doc.text(`${stat.label}: ${stat.value}`, 14, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Tableau des données
    if (options.data.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [options.columns.map((col) => col.header)],
        body: options.data.map((row) =>
          options.columns.map((col) => {
            const value = row[col.dataKey];
            if (typeof value === 'number') {
              return value.toLocaleString('fr-FR');
            }
            if (value instanceof Date) {
              return value.toLocaleDateString('fr-FR');
            }
            return value || '';
          })
        ),
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: options.styles?.primaryColor || this.DEFAULT_COLOR,
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: options.columns.reduce((acc, col, index) => {
          if (col.width) {
            acc[index] = { cellWidth: col.width };
          }
          return acc;
        }, {} as any),
      });
    }

    // Footer avec pagination
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Téléchargement
    const filename = `${options.title.replace(/\s+/g, '_')}_${dateStr}.pdf`;
    doc.save(filename);
  }

  static async exportToExcel(options: ExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Feuille Synthèse
    const summaryData: any[][] = [
      [options.title],
      [''],
      ['Association', options.metadata?.association || this.DEFAULT_ASSOCIATION],
      ['Date de génération', new Date(options.metadata?.dateGeneration || new Date()).toLocaleDateString('fr-FR')],
    ];

    if (options.metadata?.periode) {
      summaryData.push(['Période', options.metadata.periode]);
    }

    if (options.stats && options.stats.length > 0) {
      summaryData.push(['']);
      summaryData.push(['Statistiques']);
      options.stats.forEach((stat) => {
        summaryData.push([stat.label, stat.value]);
      });
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');

    // Feuille Données
    if (options.data.length > 0) {
      const dataSheet = XLSX.utils.json_to_sheet(
        options.data.map((row) => {
          const newRow: any = {};
          options.columns.forEach((col) => {
            newRow[col.header] = row[col.dataKey];
          });
          return newRow;
        })
      );
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Données');
    }

    // Téléchargement
    const dateStr = new Date(options.metadata?.dateGeneration || new Date()).toLocaleDateString('fr-FR');
    const filename = `${options.title.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  static async exportToCSV(options: ExportOptions): Promise<void> {
    // Header
    let csv = '\uFEFF'; // UTF-8 BOM pour Excel
    csv += `${options.title}\n`;
    csv += `Association: ${options.metadata?.association || this.DEFAULT_ASSOCIATION}\n`;
    csv += `Date: ${new Date(options.metadata?.dateGeneration || new Date()).toLocaleDateString('fr-FR')}\n`;
    
    if (options.metadata?.periode) {
      csv += `Période: ${options.metadata.periode}\n`;
    }
    
    csv += '\n';

    // Statistiques
    if (options.stats && options.stats.length > 0) {
      csv += 'Statistiques\n';
      options.stats.forEach((stat) => {
        csv += `${stat.label},${stat.value}\n`;
      });
      csv += '\n';
    }

    // Colonnes
    csv += options.columns.map((col) => col.header).join(',') + '\n';

    // Données
    options.data.forEach((row) => {
      csv += options.columns
        .map((col) => {
          const value = row[col.dataKey];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',') + '\n';
    });

    // Téléchargement
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date(options.metadata?.dateGeneration || new Date()).toLocaleDateString('fr-FR');
    const filename = `${options.title.replace(/\s+/g, '_')}_${dateStr}.csv`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  static async export(options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(options);
      case 'excel':
        return this.exportToExcel(options);
      case 'csv':
        return this.exportToCSV(options);
      default:
        throw new Error(`Format non supporté: ${options.format}`);
    }
  }
}
