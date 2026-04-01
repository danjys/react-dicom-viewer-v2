import React, { useState } from "react";
import PatientList from "./PatientList";
import StudyList from "./StudyList";
import SeriesList from "./SeriesList";
import OrthancViewer from "./OrthancViewer"; // <- updated
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
                    selectedStudy={selectedStudy}
                    onStudySelect={study => {
                        setSelectedStudy(study);
                        setSelectedSeries(null);
                    }}
                />
            </div>

            <div className="column">
                <SeriesList
                    study={selectedStudy}
                    selectedSeries={selectedSeries}
                    onSeriesSelect={series => setSelectedSeries(series)}
                />
            </div>

            <div className="column">
                <OrthancViewer series={selectedSeries} />
            </div>
        </div>
    );
}

export default Dashboard;