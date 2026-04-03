// OrthancViewer3D.jsx - USING ORTHANC'S TRANSCODING API
import React, { useEffect, useRef, useState } from "react";
import {
  init as coreInit,
  RenderingEngine,
  Enums,
  volumeLoader,
  setVolumesForViewports,
} from "@cornerstonejs/core";
import {
  init as toolsInit,
  addTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  ToolGroupManager,
  Enums as ToolsEnums,
} from "@cornerstonejs/tools";

import "./OrthancViewer3D.css";

const { ViewportType } = Enums;
const { MouseBindings } = ToolsEnums;

function OrthancViewer3D({ series }) {
  const viewportRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState(null);
  const renderingEngineRef = useRef(null);
  const toolGroupRef = useRef(null);

  // Initialize Cornerstone3D
  useEffect(() => {
    const initAll = async () => {
      try {
        console.log("[DEBUG] Initializing Cornerstone3D...");
        await coreInit();
        await toolsInit();
        
        addTool(PanTool);
        addTool(ZoomTool);
        addTool(StackScrollTool);
        
        setInitialized(true);
        console.log("[DEBUG] Initialization complete.");
      } catch (err) {
        console.error("[DEBUG] Initialization error:", err);
        setError(err.message);
      }
    };
    
    initAll();
  }, []);

  useEffect(() => {
    if (!series || !initialized || !viewportRef.current) return;

    const createVolumeViewer = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        setLoadingStatus("Fetching series information...");
        setError(null);
        
        const seriesId = series.orthancSeriesId || series.ID;
        console.log("[DEBUG] Creating 3D volume for series:", seriesId);
        
        // Fetch series details to get modality and dimensions
        setLoadingStatus("Getting series details...");
        const seriesResponse = await fetch(`/api/series/${seriesId}`, {
          headers: {
            Authorization: "Basic " + btoa("orthanc:orthanc"),
            Accept: "application/json",
          },
        });
        
        if (!seriesResponse.ok) {
          throw new Error(`HTTP error! status: ${seriesResponse.status}`);
        }
        
        const seriesDetails = await seriesResponse.json();
        console.log("[DEBUG] Series details:", seriesDetails);
        
        setLoadingProgress(10);
        
        // Fetch all instances in the series
        setLoadingStatus("Fetching DICOM instances from Orthanc...");
        const instancesResponse = await fetch(`/api/series/${seriesId}/instances`, {
          headers: {
            Authorization: "Basic " + btoa("orthanc:orthanc"),
            Accept: "application/json",
          },
        });
        
        if (!instancesResponse.ok) {
          throw new Error(`HTTP error! status: ${instancesResponse.status}`);
        }
        
        const instances = await instancesResponse.json();
        console.log("[DEBUG] Found instances:", instances.length);
        
        if (!instances || instances.length === 0) {
          throw new Error("No instances found for this series");
        }
        
        setLoadingProgress(20);
        setLoadingStatus(`Found ${instances.length} DICOM instances`);
        
        // Sort by instance number
        const sortedInstances = [...instances].sort(
          (a, b) =>
            (parseInt(a.MainDicomTags?.InstanceNumber) || 0) -
            (parseInt(b.MainDicomTags?.InstanceNumber) || 0)
        );
        
        // Force Orthanc to transcode to uncompressed format by adding ?compress=false
        // This is critical for compressed DICOM files
        const imageIds = sortedInstances.map((instance) => {
          // Add parameters to force uncompressed transfer syntax
          const url = `${window.location.origin}/api/instances/${instance.ID}/file?compress=false`;
          return `wadouri:${url}`;
        });
        
        console.log("[DEBUG] Created", imageIds.length, "imageIds with uncompressed flag");
        console.log("[DEBUG] First imageId:", imageIds[0]);
        
        setLoadingProgress(30);
        setLoadingStatus("Creating volume with uncompressed DICOM data...");
        
        // Clean up previous
        if (renderingEngineRef.current) {
          renderingEngineRef.current.destroy();
          renderingEngineRef.current = null;
        }
        
        // Create volume using the basic volume loader
        const volumeId = `volume-${Date.now()}`;
        
        // Register a custom image loader that adds authentication headers
        const customImageLoader = {
          loadImage: async (imageId) => {
            console.log("[CUSTOM LOADER] Loading:", imageId);
            const url = imageId.replace('wadouri:', '');
            
            try {
              const response = await fetch(url, {
                headers: {
                  "Authorization": "Basic " + btoa("orthanc:orthanc"),
                },
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              console.log("[CUSTOM LOADER] Got", arrayBuffer.byteLength, "bytes");
              
              // Create a blob URL for the DICOM data
              const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
              const blobUrl = URL.createObjectURL(blob);
              
              // Import cornerstone WADO loader dynamically
              const { wadouri } = await import('@cornerstonejs/dicom-image-loader');
              
              // Load the image using the WADO loader
              const image = await wadouri.loadImage(`wadouri:${blobUrl}`);
              
              // Clean up blob URL
              URL.revokeObjectURL(blobUrl);
              
              console.log("[CUSTOM LOADER] Image loaded:", {
                width: image.width,
                height: image.height,
                rows: image.rows,
                columns: image.columns
              });
              
              return image;
            } catch (error) {
              console.error("[CUSTOM LOADER] Error:", error);
              throw error;
            }
          }
        };
        
        // Create volume with custom loader
        const volume = await volumeLoader.createAndCacheVolume(volumeId, {
          imageIds: imageIds,
          imageLoader: customImageLoader.loadImage,
        });
        
        setLoadingProgress(50);
        setLoadingStatus("Loading volume data (this may take a while)...");
        
        await volume.load();
        console.log("[DEBUG] Volume loaded successfully");
        
        setLoadingProgress(70);
        setLoadingStatus("Setting up rendering engine...");
        
        // Create rendering engine
        const engineId = `engine-${Date.now()}`;
        const renderingEngine = new RenderingEngine(engineId);
        renderingEngineRef.current = renderingEngine;
        
        // Create viewport
        const viewportId = `viewport-${Date.now()}`;
        
        renderingEngine.setViewports([
          {
            viewportId,
            element: viewportRef.current,
            type: ViewportType.ORTHOGRAPHIC,
            defaultOptions: {
              orientation: Enums.OrientationAxis.AXIAL,
              background: [0, 0, 0],
            },
          },
        ]);
        
        setLoadingProgress(80);
        setLoadingStatus("Rendering volume...");
        
        // Set the volume on the viewport
        await setVolumesForViewports(
          renderingEngine,
          [{ volumeId }],
          [viewportId]
        );
        
        // Get the viewport and set properties
        const viewport = renderingEngine.getViewport(viewportId);
        if (viewport) {
          await viewport.setProperties({
            voiRange: {
              lower: -160,
              upper: 240,
            },
          });
          
          await viewport.render();
          console.log("[DEBUG] Viewport rendered successfully");
        }
        
        setLoadingProgress(90);
        setLoadingStatus("Setting up interaction tools...");
        
        // Setup tool group
        const toolGroupId = `toolgroup-${Date.now()}`;
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        toolGroupRef.current = toolGroup;
        
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(StackScrollTool.toolName);
        
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Secondary }],
        });
        
        toolGroup.setToolActive(StackScrollTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Wheel }],
        });
        
        toolGroup.addViewport(viewportId, engineId);
        
        setLoadingProgress(100);
        setLoadingStatus("Complete!");
        
        setTimeout(() => {
          setLoading(false);
        }, 500);
        
      } catch (err) {
        console.error("[DEBUG] Volume creation error:", err);
        setError(`Failed to create 3D volume: ${err.message}`);
        setLoading(false);
      }
    };
    
    createVolumeViewer();
    
    return () => {
      if (toolGroupRef.current) {
        ToolGroupManager.destroyToolGroup(toolGroupRef.current.id);
      }
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
      }
    };
  }, [series, initialized]);
  
  if (error) {
    return (
      <div className="viewer-error">
        <h3>Error Loading 3D Volume</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="viewer-container">
      {loading && (
        <div className="viewer-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Creating 3D Volume...</p>
          {loadingProgress > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="progress-text">{loadingProgress}%</div>
            </div>
          )}
          <p className="loading-status">{loadingStatus}</p>
          <p className="loading-info">
            Series: {series?.MainDicomTags?.Modality || 'CT'} | Slices: 501
          </p>
        </div>
      )}
      <div 
        ref={viewportRef} 
        className="viewport"
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          outline: 'none'
        }}
      />
    </div>
  );
}

export default OrthancViewer3D;