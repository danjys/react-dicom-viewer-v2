import React, { useState, useEffect } from "react";
import './SeriesList.css';

function SeriesList({ study, selectedSeries, onSeriesSelect }) {
  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    if (!study) {
      setSeriesList([]);
      return;
    }
    setSeriesList(study.Series || []);
  }, [study]);

  return (
    <div className="series-column">
      <h2>Series</h2>
      {seriesList.length === 0 && <p>No series available.</p>}
      <ul className="series-list">
        {seriesList.map(seriesId => (
          <li key={seriesId}>
            <button
              className={`series-button ${selectedSeries === seriesId ? 'selected' : ''}`}
              onClick={() => onSeriesSelect(seriesId)}
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