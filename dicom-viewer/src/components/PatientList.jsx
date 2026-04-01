import React, { useState, useEffect } from "react";
import './PatientList.css';

function PatientList({ onPatientSelect, selectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [patientDetails, setPatientDetails] = useState({});

  // Fetch patient IDs
  useEffect(() => {
    fetch("/api/patients", {
      headers: {
        "Authorization": "Basic " + btoa("orthanc:orthanc"),
        "Accept": "application/json",
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("Patients API response:", data);
        setPatients(data);
      })
      .catch(err => console.error("Fetch patients error:", err));
  }, []);

  // Fetch patient details for labels
  useEffect(() => {
    patients.forEach(pid => {
      fetch(`/api/patients/${pid}`, {
        headers: {
          "Authorization": "Basic " + btoa("orthanc:orthanc"),
          "Accept": "application/json",
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log(`Patient details for ${pid}:`, data);
          setPatientDetails(prev => ({
            ...prev,
            [pid]: data.PatientMainDicomTags?.PatientName || pid,
          }));
        })
        .catch(err => console.error("Fetch patient detail error:", err));
    });
  }, [patients]);

  return (
    <div className="patient-column">
      <h2>Patients</h2>
      <ul className="patient-list">
        {patients.map(pid => (
          <li key={pid}>
            <button
              className={`patient-button ${selectedPatient === pid ? 'selected' : ''}`}
              onClick={() => onPatientSelect(pid)}
            >
              {patientDetails[pid] || pid}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientList;