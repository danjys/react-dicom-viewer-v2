// PatientMap.jsx - Complete working version with LEFT-JUSTIFIED nodes in each row
import React, { useState, useEffect, useRef } from 'react';
import { Graphviz } from '@hpcc-js/wasm';
import './PatientMap.css';

// Sample data with multiple studies per date
const SAMPLE_PATIENT_DATA = [
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
    connects: ['RTSTRUCT1'],
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
      const dot = generateTimelineDot(patientData, showRegistrationLines);
      console.log('Generated DOT:', dot);
      const svg = await graphviz.layout(dot, 'svg', 'dot');
      
      graphContainerRef.current.innerHTML = svg;
      addInteractivity();
      
    } catch (error) {
      console.error('Graph rendering error:', error);
      graphContainerRef.current.innerHTML = `<div style="padding: 20px; color: red; background: white; font-family: monospace;">Error: ${error.message}</div>`;
    }
  };

  const generateTimelineDot = (data, showRegistrationLines) => {
    const lines = [];
    lines.push('digraph timeline {');
    lines.push('  rankdir=TB;');
    lines.push('  splines=ortho;');
    lines.push('  nodesep=0.3;');
    lines.push('  ranksep=0.8;');
    lines.push('  newrank=true;');
    lines.push('  bgcolor=transparent;');
    lines.push('');
    
    // Group nodes by date
    const nodesByDate = {};
    data.forEach(node => {
      const date = node.dateAnchor || node.time;
      if (date && date.trim()) {
        if (!nodesByDate[date]) nodesByDate[date] = [];
        nodesByDate[date].push(node);
      }
    });
    
    // Sort dates chronologically (oldest to newest for top-to-bottom)
    const sortedDates = Object.keys(nodesByDate).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    // Create invisible left-alignment anchors for each row
    sortedDates.forEach((date, idx) => {
      const dateNodes = nodesByDate[date];
      
      // Create an invisible anchor node for left alignment
      lines.push(`  left_anchor_${idx} [style=invis, width=0, height=0, shape=point];`);
      
      // Put anchor on the same rank as the date header
      lines.push(`  { rank=same; left_anchor_${idx}; row_header_${idx}; }`);
      
      // Connect anchor to first node to force left alignment
      if (dateNodes.length > 0) {
        lines.push(`  left_anchor_${idx} -> node_${idx}_0 [style=invis, weight=100];`);
      }
    });
    
    lines.push('');
    
    // Create row headers (date labels)
    sortedDates.forEach((date, idx) => {
      const formattedDate = formatDate(date);
      lines.push(`  row_header_${idx} [label="${formattedDate}", shape=plaintext, fontsize=14, fontcolor="#666666", fontname="Arial Bold"];`);
    });
    
    lines.push('');
    
    // Connect row headers vertically
    for (let i = 0; i < sortedDates.length - 1; i++) {
      lines.push(`  row_header_${i} -> row_header_${i + 1} [style=invis, weight=100];`);
    }
    
    lines.push('');
    
    // Create individual nodes for each study (not as tables)
    sortedDates.forEach((date, idx) => {
      const dateNodes = nodesByDate[date];
      
      dateNodes.forEach((node, nodeIdx) => {
        const color = getNodeColor(node.modality);
        const label = `${node.label}\\n${node.modality}`;
        lines.push(`  node_${idx}_${nodeIdx} [label="${label}", fillcolor="${color}", style="filled,rounded", shape=box, width=1.2, height=0.8, fontname="Arial", fontsize=10];`);
      });
    });
    
    lines.push('');
    
    // Put nodes in each row on the same rank and chain them left-to-right
    sortedDates.forEach((date, idx) => {
      const dateNodes = nodesByDate[date];
      const nodeIds = [];
      
      for (let i = 0; i < dateNodes.length; i++) {
        nodeIds.push(`node_${idx}_${i}`);
      }
      
      if (nodeIds.length > 0) {
        // Create invisible chain from left anchor to first node to force left alignment
        lines.push(`  left_anchor_${idx} -> ${nodeIds[0]} [style=invis, weight=100];`);
        
        // Chain nodes horizontally
        for (let i = 0; i < nodeIds.length - 1; i++) {
          lines.push(`  ${nodeIds[i]} -> ${nodeIds[i + 1]} [style=invis, weight=50];`);
        }
        
        // Put all nodes on the same rank
        lines.push(`  { rank=same; left_anchor_${idx}; ${nodeIds.join('; ')}; }`);
      }
    });
    
    lines.push('');
    lines.push('  // Relationship edges');
    
    // Add relationship edges
    data.forEach(node => {
      if (node.connects && node.connects.length > 0) {
        node.connects.forEach(target => {
          // Skip registration lines if toggle is off
          if (node.modality === 'REG' && !showRegistrationLines) return;
          
          // Find which rows and positions contain source and target
          let sourceRow = null, sourcePos = null;
          let targetRow = null, targetPos = null;
          
          for (let i = 0; i < sortedDates.length; i++) {
            const date = sortedDates[i];
            const dateNodes = nodesByDate[date];
            
            const sourceIndex = dateNodes.findIndex(n => n.id === node.id);
            if (sourceIndex !== -1) {
              sourceRow = i;
              sourcePos = sourceIndex;
            }
            
            const targetIndex = dateNodes.findIndex(n => n.id === target);
            if (targetIndex !== -1) {
              targetRow = i;
              targetPos = targetIndex;
            }
          }
          
          if (sourceRow !== null && targetRow !== null && sourcePos !== null && targetPos !== null) {
            const isReg = node.modality === 'REG';
            if (isReg) {
              lines.push(`  node_${sourceRow}_${sourcePos} -> node_${targetRow}_${targetPos} [style="dashed", color="#FF6B6B", penwidth=2, arrowhead=none, constraint=false];`);
            } else {
              lines.push(`  node_${sourceRow}_${sourcePos} -> node_${targetRow}_${targetPos} [style="solid", color="#666666", penwidth=2];`);
            }
          }
        });
      }
    });
    
    lines.push('}');
    return lines.join('\n');
  };

  const addInteractivity = () => {
    const svgElement = graphContainerRef.current?.querySelector('svg');
    if (!svgElement) return;
    
    // Find all node elements
    const nodes = svgElement.querySelectorAll('.node');
    const nodeMap = new Map();
    
    // Map node elements to their IDs
    nodes.forEach(node => {
      const title = node.querySelector('title');
      if (title) {
        const nodeId = title.textContent;
        nodeMap.set(nodeId, node);
        
        // Find which data node this corresponds to
        const match = nodeId.match(/node_(\d+)_(\d+)/);
        if (match) {
          const row = parseInt(match[1]);
          const pos = parseInt(match[2]);
          
          // Find the actual data node
          const dates = Object.keys(groupNodesByDate(patientData));
          const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));
          const date = sortedDates[row];
          const nodesByDate = groupNodesByDate(patientData);
          const dataNode = nodesByDate[date]?.[pos];
          
          if (dataNode) {
            node.style.cursor = 'pointer';
            node.style.transition = 'all 0.2s ease';
            
            node.addEventListener('click', (e) => {
              e.stopPropagation();
              setSelectedNode(dataNode);
              highlightNode(node);
            });
            
            node.addEventListener('mouseenter', () => {
              if (!node.classList.contains('highlighted')) {
                node.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
                node.style.transform = 'translateY(-2px)';
              }
            });
            
            node.addEventListener('mouseleave', () => {
              if (!node.classList.contains('highlighted')) {
                node.style.filter = '';
                node.style.transform = 'translateY(0)';
              }
            });
          }
        }
      }
    });
  };
  
  const groupNodesByDate = (data) => {
    const nodesByDate = {};
    data.forEach(node => {
      const date = node.dateAnchor || node.time;
      if (date && date.trim()) {
        if (!nodesByDate[date]) nodesByDate[date] = [];
        nodesByDate[date].push(node);
      }
    });
    return nodesByDate;
  };

  const highlightNode = (node) => {
    // Clear previous highlights
    document.querySelectorAll('.node').forEach(n => {
      n.classList.remove('highlighted');
      n.style.filter = '';
      n.style.transform = 'translateY(0)';
      n.style.stroke = '';
      n.style.strokeWidth = '';
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
    if (!dateStr) return 'Date Unknown';
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
              onClick={() => {
                setSelectedNode(null);
                // Clear highlight from UI
                document.querySelectorAll('.node').forEach(n => {
                  n.classList.remove('highlighted');
                  n.style.filter = '';
                  n.style.transform = 'translateY(0)';
                  n.style.stroke = '';
                  n.style.strokeWidth = '';
                });
              }}
              style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '14px' }}
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