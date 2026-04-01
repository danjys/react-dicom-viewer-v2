import React, { useState, useEffect } from "react";
import './StudyList.css';

function StudyList({ patientId, onStudySelect, selectedStudy }) {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    if (!patientId) {
      console.log("No patient selected, clearing studies.");
      setStudies([]);
      return;
    }

    console.log(`Fetching studies for patient ${patientId}...`);

    fetch(`/api/patients/${patientId}/studies`, {
      headers: {
        "Authorization": "Basic " + btoa("orthanc:orthanc"),
        "Accept": "application/json",
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log(`Studies API response for ${patientId}:`, data);
        setStudies(data);
      })
      .catch(err => console.error("Fetch studies error:", err));
  }, [patientId]);

  const handleStudyClick = (study) => {
    console.log("Study clicked:", study);
    if (onStudySelect) onStudySelect(study);
  }

  return (
    <div className="study-column">
      <h2>Studies</h2>
      <ul className="study-list">
        {studies.map(study => (
          <li key={study.ID}>
            <button
              className={`study-button ${selectedStudy?.ID === study.ID ? 'selected' : ''}`}
              onClick={() => handleStudyClick(study)}
            >
              {study.MainDicomTags?.StudyDescription || study.ID} &nbsp;
              ({study.MainDicomTags?.StudyDate || "No Date"}) - 
              {study.Series?.length || 0} series
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudyList;