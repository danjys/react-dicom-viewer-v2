// Dashboard.jsx - WITH 2D/3D/PatientMap TOGGLE AND PROPER CSS CLASSES
import React, { useState } from "react";
import PatientList from "./PatientList";
import StudyList from "./StudyList";
import SeriesList from "./SeriesList";
import OrthancViewer3D from "./OrthancViewer3D";
import OrthancViewer from "./OrthancViewer";
import PatientMap from "./PatientMap"; // Import your PatientMap component
import './Dashboard.css';

function Dashboard() {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedStudy, setSelectedStudy] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [viewerMode, setViewerMode] = useState("2D"); // "2D", "3D", or "patientmap"
    const [isSwitching, setIsSwitching] = useState(false);

    const handleViewerModeChange = (mode) => {
        if (mode === viewerMode) return;
        setIsSwitching(true);
        setViewerMode(mode);
        setTimeout(() => setIsSwitching(false), 300);
    };

    // Helper to render the appropriate viewer
    const renderViewer = () => {
        if (!selectedSeries) {
            return (
                <div className="no-series-selected">
                    <p>Select a series from the list to view</p>
                </div>
            );
        }

        switch(viewerMode) {
            case "2D":
                return <OrthancViewer series={selectedSeries.orthancSeriesId || selectedSeries.ID} />;
            case "3D":
                return <OrthancViewer3D series={selectedSeries} />;
            case "patientmap":
                return <PatientMap series={selectedSeries} patientId={selectedPatient} studyId={selectedStudy} />;
            default:
                return <OrthancViewer series={selectedSeries.orthancSeriesId || selectedSeries.ID} />;
        }
    };

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
                {/* Viewer Toolbar */}
                <div className="viewer-toolbar">
                    <div className="viewer-mode-buttons">
                        <button
                            className={`mode-button ${viewerMode === "2D" ? "active" : ""}`}
                            onClick={() => handleViewerModeChange("2D")}
                            disabled={!selectedSeries}
                        >
                            📄 2D Viewer
                        </button>
                        <button
                            className={`mode-button ${viewerMode === "3D" ? "active" : ""}`}
                            onClick={() => handleViewerModeChange("3D")}
                            disabled={!selectedSeries}
                        >
                            🧊 3D Volume Viewer
                        </button>
                        <button
                            className={`mode-button ${viewerMode === "patientmap" ? "active" : ""}`}
                            onClick={() => handleViewerModeChange("patientmap")}
                            disabled={!selectedPatient} // PatientMap needs at least a patient
                        >
                            🗺️ Patient Treatment Map
                        </button>
                    </div>
                    {selectedSeries && (
                        <div className="series-info">
                            {selectedSeries.MainDicomTags?.Modality || 'CT'} | 
                            {selectedSeries.MainDicomTags?.SeriesDescription?.substring(0, 30) || 'No description'}
                            {selectedSeries.MainDicomTags?.SeriesDescription?.length > 30 ? '...' : ''}
                        </div>
                    )}
                </div>
                
                {/* Viewer Container */}
                <div className={`viewer-container ${isSwitching ? 'loading' : ''}`}>
                    {renderViewer()}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;