// PatientMap.jsx - Direct translation of working Angular code
import React, { useState, useEffect, useRef } from 'react';
import { Graphviz } from '@hpcc-js/wasm';
import './PatientMap.css';

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
    dateAnchor: '2023-06-01',
    connects: ['CT1'],
    metadata: { sequence: 'T1' }
  },
  {
    id: 'RTSTRUCT1',
    label: 'Initial Structures',
    modality: 'RTSTRUCT',
    time: '2023-06-01',
    dateAnchor: '2023-06-01',
    connects: ['CT1'],
    metadata: { rois: 6 }
  },
  {
    id: 'RTPLAN1',
    label: 'Plan A',
    modality: 'RTPLAN',
    time: '2023-06-02',
    dateAnchor: '2023-06-02',
    connects: ['RTSTRUCT1', 'CT1'],
    metadata: { technique: 'IMRT', fractions: 25 }
  },
  {
    id: 'RTDOSE1',
    label: 'Dose A',
    modality: 'RTDOSE',
    time: '2023-06-02',
    dateAnchor: '2023-06-02',
    connects: ['RTPLAN1'],
    metadata: { dose: '50Gy' }
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
    dateAnchor: '2023-06-03',
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
    dateAnchor: '2023-06-04',
    connects: ['MR2'],
    metadata: { rois: 5 }
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
    dateAnchor: '2023-06-05',
    connects: ['RTSTRUCT2', 'CT2'],
    metadata: { technique: 'VMAT', fractions: 20 }
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
    id: 'PET1',
    label: 'Historical PET-CT',
    modality: 'PET',
    time: '',
    dateAnchor: '',
    connects: ['CT1'],
    metadata: { tracer: 'FDG' }
  }
];

const PatientMap = ({ series, patientId, studyId }) => {
  const graphContainerRef = useRef(null);
  const [showRegistrationLines, setShowRegistrationLines] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [patientData] = useState(PATIENT_DATA);

  useEffect(() => {
    if (patientData.length > 0) {
      renderGraph();
    }
  }, [patientData, showRegistrationLines]);

  const renderGraph = async () => {
    if (!graphContainerRef.current) return;
    
    try {
      const graphviz = await Graphviz.load();
      const dot = generateDotFromDicom(patientData, showRegistrationLines);
      console.log('Generated DOT:', dot);
      const svg = await graphviz.layout(dot, 'svg', 'dot');
      graphContainerRef.current.innerHTML = svg;
      addInteractivity();
    } catch (error) {
      console.error('Graph rendering error:', error);
      graphContainerRef.current.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
    }
  };

  const generateDotFromDicom = (data, showRegistrationLines) => {
    const scanModalities = ['CT', 'CBCT', 'MR', 'PET', 'NM'];
    const rtModalities = ['RTSTRUCT', 'RTPLAN', 'TREAT', 'RTDOSE'];
    const registrationColors = ['#FF4500', '#008000', '#0000FF', '#FF1493', '#FFA500'];
    
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === 'no_date') return 'Missing Date';
      const dt = new Date(dateStr + 'T00:00:00Z');
      if (isNaN(dt.getTime())) return 'Invalid Date';
      return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
    };
    
    const sanitizeId = (str) => str.replace(/[^a-zA-Z0-9_]/g, '_');
    const allNodeIds = new Set(data.map(n => n.id));
    const actualNodes = showRegistrationLines ? data : data.filter(n => n.modality !== 'REG');
    
    // Node definitions
    const nodeDefs = actualNodes
      .filter(n => n.modality !== 'REG')
      .map(n => {
        const color = getNodeColor(n.modality);
        return `"${n.id}" [label="" shape=none width=0.77 height=0.5 fixedsize=true style="filled,rounded" fillcolor="${color}"];`;
      })
      .join('\n');
    
    // Group volumes by date
    const volumesByDate = {};
    actualNodes.filter(vol => scanModalities.includes(vol.modality)).forEach(vol => {
      const rawDate = vol.dateAnchor || vol.time || 'no_date';
      const date = rawDate.trim() || 'no_date';
      if (!volumesByDate[date]) volumesByDate[date] = [];
      volumesByDate[date].push(vol);
    });
    
    const rtNodes = actualNodes.filter(n => rtModalities.includes(n.modality));
    const sortedDates = Object.keys(volumesByDate).sort((a, b) => {
      if (a === 'no_date') return 1;
      if (b === 'no_date') return -1;
      return new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z');
    });
    
    const dateClusters = [];
    const allEdges = [];
    
    sortedDates.forEach(date => {
      const vols = volumesByDate[date];
      const clusterName = `cluster_${sanitizeId(date)}`;
      const dateLabelNodeId = `date_label_${sanitizeId(date)}`;
      const dateLabelText = formatDate(date);
      const dateTextColor = date === 'no_date' ? '#FF6666' : '#BBBBBB';
      
      const dateLabelNode = `"${dateLabelNodeId}" [label="${dateLabelText}" shape=plaintext fontsize=14 fontname="Arial" fontcolor="${dateTextColor}"];`;
      const edges = [];
      
      // Invisible edges to force left-to-right ordering
      for (let i = 1; i < vols.length; i++) {
        edges.push(`"${vols[i - 1].id}" -> "${vols[i].id}" [style=invis weight=100];`);
      }
      
      // Connect volumes to related RT nodes
      const rtOrder = ['RTSTRUCT', 'RTPLAN', 'TREAT', 'RTDOSE'];
      vols.forEach(vol => {
        const relatedRTs = rtNodes
          .filter(rt => rt.connects?.includes(vol.id) || vol.connects?.includes(rt.id))
          .sort((a, b) => rtOrder.indexOf(a.modality) - rtOrder.indexOf(b.modality));
        
        if (relatedRTs.length > 0) {
          edges.push(`"${vol.id}" -> "${relatedRTs[0].id}" [color="#666666" penwidth=2];`);
          for (let i = 1; i < relatedRTs.length; i++) {
            edges.push(`"${relatedRTs[i - 1].id}" -> "${relatedRTs[i].id}" [color="#666666" penwidth=2];`);
          }
        }
      });
      
      const allNodesInCluster = [
        ...vols.map(v => `"${v.id}"`),
        ...vols.flatMap(vol =>
          rtNodes
            .filter(rt => rt.connects?.includes(vol.id) || vol.connects?.includes(rt.id))
            .map(rt => `"${rt.id}"`)
        )
      ];
      
      const rankSubgraph = `subgraph ${clusterName} {
    label="";
    style=dashed;
    color=gray;
    { rank=same; ${allNodesInCluster.join('; ')}; }
    "${dateLabelNodeId}" -> "${vols[0]?.id}" [style=invis constraint=false];
  }`;
      
      dateClusters.push({ dateLabelNode, rankSubgraph, dateLabelNodeId, edges });
    });
    
    // Collect all edges
    dateClusters.forEach(dc => allEdges.push(...dc.edges));
    
    // Connect date labels vertically
    const dateLabelIds = dateClusters.map(dc => dc.dateLabelNodeId);
    for (let i = 1; i < dateLabelIds.length; i++) {
      allEdges.push(`"${dateLabelIds[i - 1]}" -> "${dateLabelIds[i]}" [style=invis];`);
    }
    
    // Add registration lines
    if (showRegistrationLines) {
      let colorIndex = 0;
      data.forEach(node => {
        if (node.modality === 'REG' && Array.isArray(node.connects) && node.connects.length >= 2) {
          const [source, target] = node.connects;
          if (allNodeIds.has(source) && allNodeIds.has(target)) {
            const color = registrationColors[colorIndex++ % registrationColors.length];
            allEdges.push(`"${source}" -> "${target}" [color="${color}" style=dashed penwidth=2 label="reg" fontcolor="${color}" fontsize=8 arrowhead=none];`);
          }
        }
      });
    }
    
    return `digraph patientmap {
  graph [rankdir=TB bgcolor=transparent];
  node [fontname="Arial" fontsize=10];
  edge [color="#666666" penwidth=2];
  
  ${dateClusters.map(dc => dc.dateLabelNode).join('\n')}
  ${nodeDefs}
  ${dateClusters.map(dc => dc.rankSubgraph).join('\n')}
  ${allEdges.join('\n')}
}`;
  };

  const addInteractivity = () => {
    const svgElement = graphContainerRef.current?.querySelector('svg');
    if (!svgElement) return;
    
    const nodes = svgElement.querySelectorAll('g.node');
    nodes.forEach(node => {
      const titleElement = node.querySelector('title');
      let nodeId = titleElement?.textContent || node.getAttribute('id');
      
      if (nodeId && !nodeId.startsWith('date_label')) {
        node.style.cursor = 'pointer';
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          const found = patientData.find(n => n.id === nodeId);
          if (found) {
            setSelectedNode(found);
            highlightNode(node);
          }
        });
      }
    });
  };

  const highlightNode = (node) => {
    document.querySelectorAll('g.node').forEach(n => {
      n.classList.remove('highlighted');
      const shape = n.querySelector('ellipse, rect, polygon');
      if (shape) shape.style.filter = '';
    });
    
    node.classList.add('highlighted');
    const shape = node.querySelector('ellipse, rect, polygon');
    if (shape) shape.style.filter = 'drop-shadow(0 0 10px rgba(0, 150, 255, 0.5))';
  };

  const getNodeColor = (modality) => {
    const colors = {
      'CT': '#e0f7fa', 'CBCT': '#e8f5e9', 'MR': '#f3e5f5', 'PET': '#fff3e0',
      'NM': '#efebe9', 'RTSTRUCT': '#e1f5fe', 'RTPLAN': '#ede7f6',
      'RTDOSE': '#fbe9e7', 'TREAT': '#fbe9e7', 'REG': '#ffebee'
    };
    return colors[modality] || '#e0e0e0';
  };

  return (
    <div className="patientmap-wrapper">
      <div className="patientmap-controls">
        <div className="toggle-switch">
          <input type="checkbox" id="toggleRegLines" onChange={() => setShowRegistrationLines(!showRegistrationLines)} checked={showRegistrationLines} />
          <label htmlFor="toggleRegLines"></label>
          <span className="toggle-label">Show Registration Lines</span>
        </div>
        {selectedNode && (
          <div className="selected-node-info">
            <strong>Selected:</strong> {selectedNode.label}
            <button onClick={() => setSelectedNode(null)}>✕</button>
          </div>
        )}
      </div>
      <div ref={graphContainerRef} className="patientmap-graph"></div>
    </div>
  );
};

export default PatientMap;