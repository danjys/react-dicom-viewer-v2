import React, { useState, useEffect } from "react";
import "./PatientList.css";

function PatientList({ onPatientSelect, selectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [patientDetails, setPatientDetails] = useState({});

  // Format DICOM date (YYYYMMDD → YYYY-MM-DD)
  const formatDate = (dicomDate) => {
    if (!dicomDate || dicomDate.length !== 8) return "N/A";
    return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
  };

  // Fetch patient IDs
  useEffect(() => {
    fetch("/api/patients", {
      headers: {
        Authorization: "Basic " + btoa("orthanc:orthanc"),
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Patients API response:", data);
        setPatients(data);
      })
      .catch((err) => console.error("Fetch patients error:", err));
  }, []);

  // Fetch patient details
  useEffect(() => {
    patients.forEach((pid) => {
      // Avoid refetching if already cached
      if (patientDetails[pid]) return;

      fetch(`/api/patients/${pid}`, {
        headers: {
          Authorization: "Basic " + btoa("orthanc:orthanc"),
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(`Patient details for ${pid}:`, data);

          setPatientDetails((prev) => ({
            ...prev,
            [pid]: {
              name: data.MainDicomTags?.PatientName || pid,
              dob: data.MainDicomTags?.PatientBirthDate || "",
              sex: data.MainDicomTags?.PatientSex || "N/A",
            },
          }));
        })
        .catch((err) =>
          console.error("Fetch patient detail error:", err)
        );
    });
  }, [patients]);

  return (
    <div className="patient-column">
      <h2>Patients</h2>

      <ul className="patient-list">
        {patients.map((pid) => {
          const patient = patientDetails[pid];

          return (
            <li key={pid}>
              <button
                className={`patient-card ${
                  selectedPatient === pid ? "selected" : ""
                }`}
                onClick={() => onPatientSelect(pid)}
              >
                <div className="patient-name">
                  {patient?.name || pid}
                </div>

                <div className="patient-meta">
                  <span>DOB: {formatDate(patient?.dob)}</span>
                  <span>Sex: {patient?.sex}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PatientList;