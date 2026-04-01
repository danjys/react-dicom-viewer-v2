import React, { useEffect, useState } from "react";

function StudyList({ patientId, onSelectStudy, onBack }) {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8042/patients/${patientId}/studies`, {
      headers: {
        Authorization: "Basic " + btoa("orthanc:orthanc"),
      },
    })
      .then((res) => res.json())
      .then((data) => setStudies(data))
      .catch(console.error);
  }, [patientId]);

  return (
    <div>
      <button onClick={onBack}>← Back to Patients</button>
      <h2>Select a Study</h2>
      <ul>
        {studies.map((s) => (
          <li key={s.ID}>
            <button onClick={() => onSelectStudy(s.ID)}>
              {s.MainDicomTags.StudyDescription || s.ID}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudyList;