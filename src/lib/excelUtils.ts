import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
}

export const exportToExcel = (options: ExcelExportOptions): void => {
  const { filename, sheetName, columns, data } = options;
  
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();
  
  // Préparer les données avec les en-têtes
  const headers = columns.map(col => col.header);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (typeof value === 'number' && col.key.includes('montant')) {
        return value;
      }
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR');
      }
      return value || '';
    })
  );
  
  const worksheetData = [headers, ...rows];
  
  // Créer la feuille de calcul
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Définir les largeurs de colonnes
  const colWidths = columns.map(col => ({ 
    wch: col.width || 15 
  }));
  ws['!cols'] = colWidths;
  
  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Télécharger le fichier
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

// Fonctions spécialisées pour chaque entité
export const exportMembresExcel = (membres: any[]) => {
  exportToExcel({
    filename: `membres_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Membres',
    columns: [
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'telephone', width: 15 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Date inscription', key: 'date_inscription', width: 15 },
      { header: 'Membre E2D', key: 'est_membre_e2d', width: 12 },
      { header: 'Adhérent Phoenix', key: 'est_adherent_phoenix', width: 12 }
    ],
    data: membres
  });
};

export const exportCotisationsExcel = (cotisations: any[]) => {
  exportToExcel({
    filename: `cotisations_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Cotisations',
    columns: [
      { header: 'Membre', key: 'membre_nom', width: 25 },
      { header: 'Type cotisation', key: 'type_nom', width: 20 },
      { header: 'Montant', key: 'montant', width: 15 },
      { header: 'Date paiement', key: 'date_paiement', width: 15 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 }
    ],
    data: cotisations
  });
};

export const exportPretsExcel = (prets: any[]) => {
  exportToExcel({
    filename: `prets_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Prêts',
    columns: [
      { header: 'Membre', key: 'membre_nom', width: 25 },
      { header: 'Montant', key: 'montant', width: 15 },
      { header: 'Taux intérêt', key: 'taux_interet', width: 12 },
      { header: 'Date prêt', key: 'date_pret', width: 15 },
      { header: 'Échéance', key: 'echeance', width: 15 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Reconductions', key: 'reconductions', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 }
    ],
    data: prets
  });
};

export const exportAidesExcel = (aides: any[]) => {
  exportToExcel({
    filename: `aides_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Aides',
    columns: [
      { header: 'Bénéficiaire', key: 'beneficiaire_nom', width: 25 },
      { header: 'Type aide', key: 'type_nom', width: 20 },
      { header: 'Montant', key: 'montant', width: 15 },
      { header: 'Date allocation', key: 'date_allocation', width: 15 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 }
    ],
    data: aides
  });
};

export const validateImportedMembers = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    if (!row.nom || typeof row.nom !== 'string') {
      rowErrors.push(`Ligne ${index + 1}: Nom requis`);
    }
    
    if (!row.prenom || typeof row.prenom !== 'string') {
      rowErrors.push(`Ligne ${index + 1}: Prénom requis`);
    }
    
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push(`Ligne ${index + 1}: Email invalide`);
    }
    
    if (row.telephone && !/^[\d\s\-\+\(\)]+$/.test(row.telephone)) {
      rowErrors.push(`Ligne ${index + 1}: Téléphone invalide`);
    }
    
    if (rowErrors.length === 0) {
      valid.push({
        nom: row.nom.trim(),
        prenom: row.prenom.trim(),
        email: row.email?.trim() || null,
        telephone: row.telephone?.trim() || null,
        statut: row.statut || 'actif',
        date_inscription: row.date_inscription || new Date().toISOString().split('T')[0],
        est_membre_e2d: row.est_membre_e2d !== false,
        est_adherent_phoenix: row.est_adherent_phoenix === true
      });
    } else {
      errors.push(...rowErrors);
    }
  });
  
  return { valid, errors };
};