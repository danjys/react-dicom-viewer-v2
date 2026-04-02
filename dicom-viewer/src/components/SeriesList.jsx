import React, { useState, useEffect } from "react";
import "./SeriesList.css";

function SeriesList({ study, selectedSeries, onSeriesSelect }) {
  const [seriesList, setSeriesList] = useState([]);
  const [seriesDetails, setSeriesDetails] = useState({});

  // Format DICOM date
  const formatDate = (dicomDate) => {
    if (!dicomDate || dicomDate.length !== 8) return "N/A";
    return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
  };

  // Update series list when study changes
  useEffect(() => {
    if (!study) {
      setSeriesList([]);
      return;
    }
    setSeriesList(study.Series || []);
  }, [study]);

  // Fetch series details
  useEffect(() => {
    seriesList.forEach((sid) => {
      if (seriesDetails[sid]) return; // avoid duplicate fetch

      fetch(`/api/series/${sid}`, {
        headers: {
          Authorization: "Basic " + btoa("orthanc:orthanc"),
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setSeriesDetails((prev) => ({
            ...prev,
            [sid]: {
              description:
                data.MainDicomTags?.SeriesDescription || "No Description",
              date: data.MainDicomTags?.SeriesDate || "",
              modality: data.MainDicomTags?.Modality || "",
            },
          }));
        })
        .catch((err) =>
          console.error("Fetch series detail error:", err)
        );
    });
  }, [seriesList]);

  return (
    <div className="series-column">
      <h2>Series</h2>

      {seriesList.length === 0 && <p>No series available.</p>}

      <ul className="series-list">
        {seriesList.map((sid) => {
          const series = seriesDetails[sid];

          return (
            <li key={sid}>
              <button
                className={`series-card ${
                  selectedSeries === sid ? "selected" : ""
                }`}
                onClick={() => onSeriesSelect(sid)}
              >
                <div className="series-title">
                  {series?.description || sid}
                </div>

                <div className="series-meta">
                  <span>{formatDate(series?.date)}</span>
                  <span>{series?.modality}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SeriesList;