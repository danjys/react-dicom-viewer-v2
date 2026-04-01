import React, { useRef, useEffect } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import cornerstoneMath from "cornerstone-math";

// connect external modules
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

function DicomViewer() {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    cornerstone.enable(viewerRef.current);

    // initialize tools
    cornerstoneTools.init();
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);

    // activate tools
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 }); // left drag
    cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 }); // right drag
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(viewerRef.current, image);
    } catch (err) {
      console.error(err);
      alert("Error loading DICOM file. Check console.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>DICOM Viewer</h2>

      <input type="file" accept=".dcm" onChange={handleFileChange} />

      <div
        ref={viewerRef}
        style={{
          width: 512,
          height: 512,
          border: "2px solid black",
          marginTop: 10,
          backgroundColor: "#000",
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default DicomViewer;