import React, { useState } from "react";
import PatientList from "./PatientList";
import StudyList from "./StudyList";
import SeriesList from "./SeriesList";
import DicomViewer from "./DicomViewer";
import './Dashboard.css';

function Dashboard() {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedStudy, setSelectedStudy] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);

    return (
        <div className="dashboard">
            <div className="column">
                <PatientList
                    selectedPatient={selectedPatient}
                    onPatientSelect={pid => {
                        setSelectedPatient(pid);
                        setSelectedStudy(null);
                        setSelectedSeries(null);
                    }}
                />
            </div>

            <div className="column">
                <StudyList
                    patientId={selectedPatient}
                    selectedStudy={selectedStudy}   // <- pass the selectedStudy for styling
                    onStudySelect={study => {
                        setSelectedStudy(study);
                        setSelectedSeries(null);
                    }}
                />
            </div>

            <div className="column">
                <SeriesList
                    study={selectedStudy}
                    onSeriesSelect={series => setSelectedSeries(series)}
                />
            </div>

            <div className="column">
                <DicomViewer series={selectedSeries} />
            </div>
        </div>
    );
}

export default Dashboard;