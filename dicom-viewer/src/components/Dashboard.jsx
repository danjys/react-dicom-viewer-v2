// Dashboard.jsx - WITH 2D/3D TOGGLE AND PROPER CSS CLASSES
import React, { useState } from "react";
import PatientList from "./PatientList";
import StudyList from "./StudyList";
import SeriesList from "./SeriesList";
import OrthancViewer3D from "./OrthancViewer3D";
import OrthancViewer from "./OrthancViewer";
import './Dashboard.css';

function Dashboard() {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedStudy, setSelectedStudy] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [viewerMode, setViewerMode] = useState("2D"); // "2D" or "3D"
    const [isSwitching, setIsSwitching] = useState(false);

    const handleViewerModeChange = (mode) => {
        if (mode === viewerMode) return;
        setIsSwitching(true);
        setViewerMode(mode);
        setTimeout(() => setIsSwitching(false), 300);
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
                    {!selectedSeries ? (
                        <div className="no-series-selected">
                            <p>Select a series from the list to view</p>
                        </div>
                    ) : viewerMode === "2D" ? (
                        <OrthancViewer series={selectedSeries.orthancSeriesId || selectedSeries.ID} />
                    ) : (
                        <OrthancViewer3D series={selectedSeries} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;