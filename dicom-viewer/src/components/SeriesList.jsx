import React, { useEffect, useState } from "react";

export default function SeriesList({ patientId, onSelectSeries }) {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (!patientId) return;

    fetch(`http://localhost:8042/patients/${patientId}/studies`, {
      headers: {
        Authorization: "Basic " + btoa("orthanc:orthanc"),
      },
    })
      .then((res) => res.json())
      .then((studyIds) => {
        // For simplicity, get series from the first study
        if (!studyIds.length) return;
        fetch(`http://localhost:8042/studies/${studyIds[0]}/series`, {
          headers: {
            Authorization: "Basic " + btoa("orthanc:orthanc"),
          },
        })
          .then((res) => res.json())
          .then(setSeries);
      })
      .catch(console.error);
  }, [patientId]);

  return (
    <div>
      <h3>Series for Patient {patientId}</h3>
      <ul>
        {series.map((id) => (
          <li key={id}>
            <button onClick={() => onSelectSeries(id)}>{id}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}