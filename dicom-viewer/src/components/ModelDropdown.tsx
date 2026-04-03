// ModelDropdown.tsx
export const ModelDropdown: React.FC = () => {
  return (
    <select className="model-dropdown">
      <option>Select Model</option>
      <option>Model 1</option>
      <option>Model 2</option>
    </select>
  );
};

// VolumesDisplay.tsx
export const VolumesDisplay: React.FC = () => {
  return <div className="volumes-display">Volumes Display</div>;
};

// PatientTimeline.tsx
export const PatientTimeline: React.FC = () => {
  return <div className="patient-timeline">Patient Timeline</div>;
};