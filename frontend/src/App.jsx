import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PlacesPage from './pages/PlacesPage';
import EventsPage from './pages/EventsPage';
import YouthPage from './pages/YouthPage';
import CollegePage from './pages/CollegePage';
import JobsPage from './pages/JobsPage';
import FamilyPage from './pages/FamilyPage';
import InfoPage from './pages/InfoPage';

function PlacesRoute() {
  const location = useLocation();
  return <PlacesPage key={location.search} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="places" element={<PlacesRoute />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="youth" element={<YouthPage />} />
          <Route path="college" element={<CollegePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="accessibility" element={<InfoPage />} />
          <Route path="high-school" element={<InfoPage />} />
          <Route path="highschool" element={<Navigate to="/high-school" replace />} />
          <Route path="medical" element={<InfoPage />} />
          <Route path="foreign-life" element={<InfoPage />} />
          <Route path="foreigners" element={<Navigate to="/foreign-life" replace />} />
          <Route path="single-household" element={<InfoPage />} />
          <Route path="single" element={<Navigate to="/single-household" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
