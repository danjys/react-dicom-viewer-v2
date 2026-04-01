import React, { useState } from "react";
import PatientList from "./components/PatientList";
import StudyList from "./components/StudyList";
import OrthancViewer from "./components/OrthancViewer";

function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);

  return (
    <div>
      {!selectedPatient && (
        <PatientList onSelectPatient={setSelectedPatient} />
      )}

      {selectedPatient && !selectedStudy && (
        <StudyList
          patientId={selectedPatient}
          onSelectStudy={setSelectedStudy}
          onBack={() => setSelectedPatient(null)}
        />
      )}

      {selectedPatient && selectedStudy && (
        <OrthancViewer
          patientId={selectedPatient}
          studyId={selectedStudy}
          onBack={() => setSelectedStudy(null)}
        />
      )}
    </div>
  );
}

export default App;