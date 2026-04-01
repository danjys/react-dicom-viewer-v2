import React, { useRef, useEffect, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import cornerstoneMath from "cornerstone-math";

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

// Configure WADO-URI loader to add authentication
cornerstoneWADOImageLoader.configure({
  beforeSend: function (xhr) {
    xhr.setRequestHeader("Authorization", "Basic " + btoa("orthanc:orthanc"));
  },
});

function OrthancViewer({ series }) {
  const viewerRef = useRef(null);
  const [stack, setStack] = useState([]);

  // Initialize viewer + tools
  useEffect(() => {
    if (!viewerRef.current) return;

    cornerstone.enable(viewerRef.current);
    cornerstoneTools.init();

    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);

    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
    cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 });
    cornerstoneTools.setToolActive("StackScrollMouseWheel", {});

    // ✅ Resize canvas after div layout is ready
    const resizeObserver = new ResizeObserver(() => {
      cornerstone.resize(viewerRef.current, true);
    });
    resizeObserver.observe(viewerRef.current);

    return () => {
      cornerstone.disable(viewerRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!series || !viewerRef.current) return;

    const fetchInstances = async () => {
      try {
        const res = await fetch(`/api/series/${series}/instances`, {
          headers: {
            Authorization: "Basic " + btoa("orthanc:orthanc"),
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error(`Error fetching series instances: ${res.status}`);

        const instanceData = await res.json();
        const sortedInstances = instanceData.sort((a, b) => {
          return (parseInt(a.MainDicomTags?.InstanceNumber || 0) - parseInt(b.MainDicomTags?.InstanceNumber || 0));
        });

        const wadouriImageIds = sortedInstances.map((instance) => `wadouri:/api/instances/${instance.ID}/file`);
        setStack(wadouriImageIds);

        if (wadouriImageIds.length === 0) return;

        const firstImage = await cornerstone.loadAndCacheImage(wadouriImageIds[0]);
        cornerstone.displayImage(viewerRef.current, firstImage);

        cornerstoneTools.addStackStateManager(viewerRef.current, ["stack"]);
        cornerstoneTools.addToolState(viewerRef.current, "stack", {
          imageIds: wadouriImageIds,
          currentImageIdIndex: 0,
        });

      } catch (err) {
        console.error("Error loading series:", err);
      }
    };

    fetchInstances();
  }, [series]);

  return (
    <div
      ref={viewerRef}
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        borderRadius: "6px",
        display: "block",
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

export default OrthancViewer;