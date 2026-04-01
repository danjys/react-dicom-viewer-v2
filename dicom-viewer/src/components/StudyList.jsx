import React, { useState, useEffect } from "react";
import './StudyList.css';

function StudyList({ patientId, onStudySelect, selectedStudy }) {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    if (!patientId) {
      setStudies([]);
      return;
    }

    fetch(`/api/patients/${patientId}/studies`, {
      headers: {
        "Authorization": "Basic " + btoa("orthanc:orthanc"),
        "Accept": "application/json",
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log(`Studies for patient ${patientId}:`, data);
        setStudies(data);
      })
      .catch(err => console.error("Fetch studies error:", err));
  }, [patientId]);

  return (
    <div className="study-column">
      <h2>Studies</h2>
      <ul className="study-list">
        {studies.map(study => (
          <li key={study.ID}>
            <button
              className={`study-button ${selectedStudy?.ID === study.ID ? 'selected' : ''}`}
              onClick={() => onStudySelect(study)}
            >
              {study.MainDicomTags?.StudyDescription || study.ID} 
              ({study.MainDicomTags?.StudyDate || "No Date"}) - {study.Series?.length || 0} series
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudyList;