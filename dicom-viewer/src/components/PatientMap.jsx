// PatientMap.jsx - Fixed DOT syntax
import React, { useState, useEffect, useRef } from 'react';
import { Graphviz } from '@hpcc-js/wasm';
import './PatientMap.css';

// Sample data directly in the component
const SAMPLE_PATIENT_DATA = [
  {
    id: 'CT1',
    label: 'Baseline CT',
    modality: 'CT',
    time: '2023-06-01',
    dateAnchor: '2023-06-01',
    connects: ['RTSTRUCT1'],
    metadata: { thickness: '1mm', resolution: '512x512' }
  },
  {
    id: 'MR1',
    label: 'Baseline MRI',
    modality: 'MR',
    time: '2023-06-01',
    dateAnchor: '2023-06-01',
    metadata: { sequence: 'T1' }
  },
  {
    id: 'RTSTRUCT1',
    label: 'Initial Structures',
    modality: 'RTSTRUCT',
    time: '2023-06-01',
    dateAnchor: '2023-06-01',
    connects: ['CT1', 'RTPLAN1'],
    metadata: { rois: 6 }
  },
  {
    id: 'RTPLAN1',
    label: 'Plan A',
    modality: 'RTPLAN',
    time: '2023-06-02',
    dateAnchor: '2023-06-02',
    connects: ['RTSTRUCT1', 'RTDOSE1'],
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
    id: 'REG1',
    label: 'Reg CT1 → CBCT1',
    modality: 'REG',
    time: '2023-06-03',
    connects: ['CT1', 'CBCT1'],
    metadata: { method: 'Rigid', comment: 'Setup verification' }
  }
];

const PatientMap = ({ series, patientId, studyId }) => {
  const graphContainerRef = useRef(null);
  const [showRegistrationLines, setShowRegistrationLines] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [patientData] = useState(SAMPLE_PATIENT_DATA);

  useEffect(() => {
    if (patientData.length > 0) {
      renderGraph();
    }
  }, [patientData, showRegistrationLines]);

  const renderGraph = async () => {
    if (!graphContainerRef.current) return;
    
    try {
      const graphviz = await Graphviz.load();
      const dot = generateGraphvizDot(patientData, showRegistrationLines);
      console.log('Generated DOT:', dot); // Debug: see the generated DOT
      const svg = await graphviz.layout(dot, 'svg', 'dot');
      
      graphContainerRef.current.innerHTML = svg;
      addInteractivity();
      
    } catch (error) {
      console.error('Graph rendering error:', error);
      graphContainerRef.current.innerHTML = `<div style="padding: 20px; color: red; background: white; font-family: monospace;">Error: ${error.message}</div>`;
    }
  };

  const generateGraphvizDot = (data, showRegistrationLines) => {
    let lines = [];
    lines.push('digraph patientmap {');
    lines.push('  graph [rankdir=TB, bgcolor=transparent, splines=ortho];');
    lines.push('  node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];');
    lines.push('  edge [color="#666666", penwidth=2];');
    lines.push('');
    
    // Group nodes by date
    const nodesByDate = {};
    data.forEach(node => {
      const date = node.dateAnchor || node.time || 'no_date';
      if (!nodesByDate[date]) nodesByDate[date] = [];
      nodesByDate[date].push(node);
    });
    
    // Sort dates
    const sortedDates = Object.keys(nodesByDate).sort((a, b) => {
      if (a === 'no_date') return 1;
      if (b === 'no_date') return -1;
      return new Date(a) - new Date(b);
    });
    
    // Create subgraphs for each date
    sortedDates.forEach((date, idx) => {
      const nodes = nodesByDate[date];
      const clusterName = `cluster_${idx}`;
      const dateLabel = formatDate(date);
      
      lines.push(`  subgraph ${clusterName} {`);
      lines.push(`    label="${dateLabel}";`);
      lines.push(`    style="dashed";`);
      lines.push(`    color="#999999";`);
      lines.push(`    fontcolor="#666666";`);
      lines.push(`    fontsize=12;`);
      lines.push(`    penwidth=1;`);
      lines.push('');
      
      nodes.forEach(node => {
        const color = getNodeColor(node.modality);
        const label = `${node.label}\\n${node.modality}`;
        // Fixed: Use proper attribute syntax without quotes around attribute names
        lines.push(`    "${node.id}" [label="${label}", fillcolor="${color}", width=1.2, height=0.8];`);
      });
      
      lines.push(`  }`);
      lines.push('');
    });
    
    // Add edges
    data.forEach(node => {
      if (node.connects && node.connects.length > 0) {
        node.connects.forEach(target => {
          // Only show registration lines if toggle is on
          if (node.modality === 'REG' && !showRegistrationLines) return;
          
          const isReg = node.modality === 'REG';
          const style = isReg ? 'style="dashed", color="#FF6B6B", penwidth=2' : 'style="solid", color="#666666", penwidth=2';
          lines.push(`  "${node.id}" -> "${target}" [${style}];`);
        });
      }
    });
    
    lines.push('}');
    return lines.join('\n');
  };

  const addInteractivity = () => {
    const svgElement = graphContainerRef.current?.querySelector('svg');
    if (!svgElement) return;
    
    // Add click handlers to nodes
    const nodes = svgElement.querySelectorAll('.node');
    nodes.forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = node.querySelector('title');
        if (title) {
          const nodeId = title.textContent;
          const found = patientData.find(n => n.id === nodeId);
          if (found) {
            setSelectedNode(found);
            highlightNode(node);
          }
        }
      });
      
      // Add hover effect
      node.addEventListener('mouseenter', () => {
        if (!node.classList.contains('highlighted')) {
          node.style.filter = 'drop-shadow(0 0 5px rgba(0,0,0,0.3))';
        }
      });
      node.addEventListener('mouseleave', () => {
        if (!node.classList.contains('highlighted')) {
          node.style.filter = '';
        }
      });
    });
  };

  const highlightNode = (node) => {
    // Clear previous highlights
    document.querySelectorAll('.node').forEach(n => {
      n.classList.remove('highlighted');
      n.style.stroke = '';
      n.style.strokeWidth = '';
      n.style.filter = '';
    });
    
    node.classList.add('highlighted');
    node.style.stroke = '#0096ff';
    node.style.strokeWidth = '3px';
    node.style.filter = 'drop-shadow(0 0 10px rgba(0, 150, 255, 0.5))';
  };

  const getNodeColor = (modality) => {
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
    return colors[modality] || '#e0e0e0';
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'no_date') return 'Date Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleRegistrationLines = () => {
    setShowRegistrationLines(!showRegistrationLines);
  };

  return (
    <div className="patientmap-wrapper">
      <div className="patientmap-controls">
        <div className="toggle-switch">
          <input
            type="checkbox"
            id="toggleRegLines"
            onChange={toggleRegistrationLines}
            checked={showRegistrationLines}
          />
          <label htmlFor="toggleRegLines"></label>
          <span className="toggle-label" style={{ color: showRegistrationLines ? '#4CAF50' : '#999' }}>
            Show Registration Lines
          </span>
        </div>
        {selectedNode && (
          <div className="selected-node-info">
            <strong>Selected:</strong> {selectedNode.label}
            <button 
              onClick={() => setSelectedNode(null)}
              style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      <div ref={graphContainerRef} className="patientmap-graph"></div>
    </div>
  );
};

export default PatientMap;