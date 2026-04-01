import React, { useState, useEffect } from "react";

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [patientDetails, setPatientDetails] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [studies, setStudies] = useState([]);

  // Fetch patient IDs
  useEffect(() => {
    fetch("/api/patients", {
      headers: {
        "Authorization": "Basic " + btoa("orthanc:orthanc"),
        "Accept": "application/json",
      },
    })
      .then(res => res.json())
      .then(setPatients)
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
        .then(data =>
          setPatientDetails(prev => ({
            ...prev,
            [pid]: data.PatientMainDicomTags?.PatientName || pid,
          }))
        )
        .catch(err => console.error("Fetch patient detail error:", err));
    });
  }, [patients]);

  // Fetch studies when a patient is selected
  useEffect(() => {
    if (!selectedPatient) return;

    fetch(`/api/patients/${selectedPatient}/studies`, {
      headers: {
        "Authorization": "Basic " + btoa("orthanc:orthanc"),
        "Accept": "application/json",
      },
    })
      .then(res => res.json())
      .then(setStudies)
      .catch(err => console.error("Fetch studies error:", err));
  }, [selectedPatient]);

  return (
    <div>
      <h2>Patients</h2>
      <ul>
        {patients.map(pid => (
          <li key={pid}>
            <button onClick={() => setSelectedPatient(pid)}>
              {patientDetails[pid] || pid} {/* safe label */}
            </button>
          </li>
        ))}
      </ul>

      {selectedPatient && (
        <div>
          <h3>Studies for {patientDetails[selectedPatient] || selectedPatient}</h3>
          <ul>
            {studies.map(study => (
              <li key={study.ID}>
                {study.StudyDescription || study.StudyInstanceUID}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PatientList;