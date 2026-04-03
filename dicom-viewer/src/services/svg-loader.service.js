// src/services/svg-loader.service.js
import { Observable } from 'rxjs';

export class SvgLoaderService {
  // Map of modalities to their SVG file paths
  getSvgPath(modality) {
    const svgMap = {
      'CT': '/assets/icons/ct.svg',
      'CBCT': '/assets/icons/cbct.svg',
      'MR': '/assets/icons/mr.svg',
      'PET': '/assets/icons/pet.svg',
      'NM': '/assets/icons/nm.svg',
      'RTSTRUCT': '/assets/icons/rtstruct.svg',
      'RTPLAN': '/assets/icons/rtplan.svg',
      'RTDOSE': '/assets/icons/rtdose.svg',
      'TREAT': '/assets/icons/treat.svg',
      'REG': '/assets/icons/reg.svg'
    };
    
    return svgMap[modality] || '/assets/icons/default.svg';
  }

  // Load SVG as string
  loadSvg(modality) {
    return new Observable((observer) => {
      const svgPath = this.getSvgPath(modality);
      
      fetch(svgPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load SVG for ${modality}`);
          }
          return response.text();
        })
        .then(svgContent => {
          observer.next(svgContent);
          observer.complete();
        })
        .catch(error => {
          console.error('Error loading SVG:', error);
          // Return a default SVG as fallback
          observer.next(this.getDefaultSvg(modality));
          observer.complete();
        });
    });
  }

  // Default SVG fallback
  getDefaultSvg(modality) {
    return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${this.getColorForModality(modality)}" rx="5"/>
      <text x="50" y="55" text-anchor="middle" fill="#333" font-size="14">${modality}</text>
    </svg>`;
  }

  getColorForModality(modality) {
    const colors = {
      'CT': '#e0f7fa',
      'CBCT': '#e8f5e9',
      'MR': '#f3e5f5',
      'PET': '#fff3e0',
      'NM': '#efebe9',
      'RTSTRUCT': '#e1f5fe',
      'RTPLAN': '#ede7f6',
      'RTDOSE': '#fbe9e7',
      'TREAT': '#fbe9e7',
      'REG': '#ffebee'
    };
    return colors[modality] || '#ffffff';
  }
}