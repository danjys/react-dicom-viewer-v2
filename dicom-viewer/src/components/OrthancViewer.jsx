import React, { useRef, useEffect } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;

export default function DicomViewer({ seriesId }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current || !seriesId) return;

    cornerstone.enable(viewerRef.current);
    cornerstoneTools.init();
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
    cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 4 });

    // Get instances in the series
    fetch(`http://localhost:8042/series/${seriesId}/instances`, {
      headers: { Authorization: "Basic " + btoa("orthanc:orthanc") },
    })
      .then((res) => res.json())
      .then((instances) => {
        if (!instances.length) return;
        // Load the first instance
        const imageUrl = `http://localhost:8042/instances/${instances[0]}/file`;
        const imageId = `wadouri:${imageUrl}`;
        cornerstoneWADOImageLoader.configure({
          beforeSend: function (xhr) {
            xhr.setRequestHeader(
              "Authorization",
              "Basic " + btoa("orthanc:orthanc")
            );
          },
        });
        cornerstone.loadImage(imageId).then((image) => {
          cornerstone.displayImage(viewerRef.current, image);
        });
      });
  }, [seriesId]);

  return (
    <div
      ref={viewerRef}
      style={{ width: 512, height: 512, border: "2px solid black" }}
    />
  );
}