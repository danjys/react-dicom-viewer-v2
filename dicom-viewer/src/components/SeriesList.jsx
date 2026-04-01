import React, { useState, useEffect } from "react";
import './SeriesList.css';

function SeriesList({ study, onSeriesSelect, selectedSeries }) {
  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    if (!study) {
      console.log("No study selected, clearing series.");
      setSeriesList([]);
      return;
    }

    console.log(`Fetching series for study ${study.ID}...`);
    setSeriesList(study.Series || []);
  }, [study]);

  const handleSeriesClick = (seriesId) => {
    console.log("Series clicked:", seriesId);
    if (onSeriesSelect) onSeriesSelect(seriesId);
  };

  return (
    <div className="series-column">
      <h2>Series</h2>
      {seriesList.length === 0 && <p>No series available.</p>}
      <ul className="series-list">
        {seriesList.map(seriesId => (
          <li key={seriesId}>
            <button
              className={`series-button ${selectedSeries === seriesId ? 'selected' : ''}`}
              onClick={() => handleSeriesClick(seriesId)}
            >
              {seriesId}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SeriesList;