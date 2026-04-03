import React, { useState, useEffect } from "react";
import "./SeriesList.css";

function SeriesList({ study, selectedSeries, onSeriesSelect }) {
  const [seriesList, setSeriesList] = useState([]);
  const [seriesDetails, setSeriesDetails] = useState({});

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
    console.log("Study changed, setting series list:", study.Series);
    setSeriesList(study.Series || []);
  }, [study]);

  // Fetch series details
  useEffect(() => {
    seriesList.forEach((sid) => {
      if (seriesDetails[sid]) return;

      console.log("Fetching details for series:", sid);

      fetch(`/api/series/${sid}`, {
        headers: {
          Authorization: "Basic " + btoa("orthanc:orthanc"),
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched series data:", data);
          setSeriesDetails((prev) => ({
            ...prev,
            [sid]: {
              description: data.MainDicomTags?.SeriesDescription || "No Description",
              date: data.MainDicomTags?.SeriesDate || "",
              modality: data.MainDicomTags?.Modality || "",
              orthancSeriesId: data.ID, // Use Orthanc internal ID to fetch instances
            },
          }));
        })
        .catch((err) => console.error("Error fetching series details:", err));
    });
  }, [seriesList]);

  const handleClick = (series) => {
    if (!series || !series.orthancSeriesId) {
      console.warn("Series not ready yet:", series);
      return;
    }
    console.log("Series clicked:", series);
    onSeriesSelect(series); // Pass the full series object
  };

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
                  selectedSeries?.orthancSeriesId === series?.orthancSeriesId ? "selected" : ""
                }`}
                onClick={() => handleClick(series)}
              >
                <div className="series-title">{series?.description || sid}</div>
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