// src/models/patientmap-data.model.js

export const PATIENT_DATA = [
  {
    id: 'CT1',
    label: 'Baseline CT',
    modality: 'CT',
    time: '2023-06-01',
    dateAnchor: '2023-06-01',
    metadata: { thickness: '1mm', resolution: '512x512' }
  },
  {
    id: 'MR1',
    label: 'Baseline MRI',
    modality: 'MR',
    time: '2023-06-01',
    connects: ['CT1'],
    metadata: { sequence: 'T1' }
  },
  {
    id: 'RTSTRUCT1',
    label: 'Initial Structures',
    modality: 'RTSTRUCT',
    time: '2023-06-01',
    connects: ['CT1'],
    metadata: { rois: 6, structureVolume: 'CT1' }
  },
  {
    id: 'RTPLAN1',
    label: 'Plan A',
    modality: 'RTPLAN',
    time: '2023-06-02',
    dateAnchor: '2023-06-02',
    connects: ['RTSTRUCT1', 'CT1'],
    metadata: { technique: 'IMRT', fractions: 25, primaryVolume: 'CT1' }
  },
  {
    id: 'RTDOSE1',
    label: 'Dose A',
    modality: 'RTDOSE',
    time: '2023-06-02',
    connects: ['RTPLAN1']
  },
  {
    id: 'TREAT1',
    label: 'Fraction 1',
    modality: 'TREAT',
    time: '2023-06-03',
    dateAnchor: '2023-06-03',
    connects: ['RTPLAN1'],
    metadata: { dose: '2Gy', fraction: '1/25' }
  },
  {
    id: 'CBCT1',
    label: 'Setup CBCT 1',
    modality: 'CBCT',
    time: '2023-06-03',
    connects: ['CT1'],
    metadata: { match: '3mm' }
  },
  {
    id: 'MR2',
    label: 'Follow-up MRI',
    modality: 'MR',
    time: '2023-06-04',
    dateAnchor: '2023-06-04',
    connects: ['MR1'],
    metadata: { sequence: 'T2' }
  },
  {
    id: 'RTSTRUCT2',
    label: 'Adapted Structures',
    modality: 'RTSTRUCT',
    time: '2023-06-04',
    connects: ['MR2'],
    metadata: { rois: 5, structureVolume: 'MR2' }
  },
  {
    id: 'CT2',
    label: 'Adaptive CT',
    modality: 'CT',
    time: '2023-06-05',
    dateAnchor: '2023-06-05',
    connects: ['CT1'],
    metadata: { thickness: '1mm' }
  },
  {
    id: 'RTPLAN2',
    label: 'Adaptive Plan',
    modality: 'RTPLAN',
    time: '2023-06-05',
    connects: ['RTSTRUCT2', 'CT2'],
    metadata: { technique: 'VMAT', fractions: 20, primaryVolume: 'CT2' }
  },
  {
    id: 'TREAT2',
    label: 'Fraction 10',
    modality: 'TREAT',
    time: '2023-06-05',
    connects: ['RTPLAN2'],
    metadata: { dose: '2Gy', fraction: '10/25' }
  },
  {
    id: 'CBCT2',
    label: 'Adaptive CBCT',
    modality: 'CBCT',
    time: '2023-06-05',
    connects: ['CT2'],
    metadata: { match: '1mm' }
  },
  {
    id: 'REG1',
    label: 'Reg CT1 → CT2',
    modality: 'REG',
    time: '2023-06-05',
    connects: ['CT1', 'CT2'],
    metadata: { method: 'Rigid', comment: 'Planning to Adaptive' }
  },
  {
    id: 'REG2',
    label: 'Reg MR1 → MR2',
    modality: 'REG',
    time: '2023-06-04',
    connects: ['MR1', 'MR2'],
    metadata: { method: 'Deformable', comment: 'MRI Alignment' }
  },
  {
    id: 'REG3',
    label: 'Reg CBCT1 → CT1',
    modality: 'REG',
    time: '2023-06-03',
    connects: ['CBCT1', 'CT1'],
    metadata: { method: 'Rigid', comment: 'Setup verification' }
  },
  {
    id: 'PET1',
    label: 'Historical PET-CT',
    modality: 'PET',
    time: '',
    connects: ['CT1'],
    metadata: { tracer: 'FDG' }
  },
  {
    id: 'RTSTRUCT3',
    label: 'Imported Structures',
    modality: 'RTSTRUCT',
    time: '',
    connects: ['CT1'],
    metadata: { rois: 3, structureVolume: 'CT1' }
  },
  {
    id: 'RTDOSE2',
    label: 'Old Dose Ref',
    modality: 'RTDOSE',
    time: '',
    connects: ['RTPLAN2']
  }
];

// Export the interface as a JSDoc comment for type checking
/**
 * @typedef {Object} PatientMapDataNode
 * @property {string} id
 * @property {string} label
 * @property {string} [name]
 * @property {string} time
 * @property {string} modality
 * @property {string[]} [registersTo]
 * @property {string} [dateAnchor]
 * @property {string[]} [connects]
 * @property {boolean} [bidirectional]
 * @property {Object} [metadata]
 */