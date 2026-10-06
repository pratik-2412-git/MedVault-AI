/**
 * artifacts/medvault-ai/src/App.tsx
 *
 * FIX: DoctorDashboard needs a full Doctor object, not just registrationNumber.
 * DoctorLogin fetches the doctor and passes it up; App stores it and forwards it.
 */

import { useState } from 'react';
import Landing          from './pages/Landing';
import PatientLogin     from './pages/PatientLogin';
import DoctorLogin      from './pages/DoctorLogin';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard  from './pages/DoctorDashboard';
import type { Doctor }  from './lib/api';

type Role = 'patient' | 'doctor';

type AppView =
  | { screen: 'landing' }
  | { screen: 'patientLogin' }
  | { screen: 'doctorLogin' }
  | { screen: 'patientDashboard'; patientId: string }
  | { screen: 'doctorDashboard'; doctor: Doctor };      // ← full Doctor object

export default function App() {
  const [view, setView] = useState<AppView>({ screen: 'landing' });

  const handleSelectRole = (role: Role) => {
    setView({ screen: role === 'patient' ? 'patientLogin' : 'doctorLogin' });
  };

  const handleBack = () => setView({ screen: 'landing' });

  switch (view.screen) {
    case 'landing':
      return <Landing onSelectRole={handleSelectRole} />;

    case 'patientLogin':
      return (
        <PatientLogin
          onBack={handleBack}
          onLogin={(patientId: string) =>
            setView({ screen: 'patientDashboard', patientId })
          }
        />
      );

    case 'doctorLogin':
      return (
        <DoctorLogin
          onBack={handleBack}
          onLogin={(doctor: Doctor) =>                   // ← receives full Doctor
            setView({ screen: 'doctorDashboard', doctor })
          }
        />
      );

    case 'patientDashboard':
      return (
        <PatientDashboard
          patientId={view.patientId}
          onBack={handleBack}
        />
      );

    case 'doctorDashboard':
      return (
        <DoctorDashboard
          doctor={view.doctor}                           // ← passes full Doctor
          onBack={handleBack}
        />
      );
  }
}