import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PlacesPage from './pages/PlacesPage';
import EventsPage from './pages/EventsPage';
import YouthPage from './pages/YouthPage';
import CollegePage from './pages/CollegePage';
import JobsPage from './pages/JobsPage';
import FamilyPage from './pages/FamilyPage';
import InfoPage from './pages/InfoPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="places" element={<PlacesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="youth" element={<YouthPage />} />
          <Route path="college" element={<CollegePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="accessibility" element={<InfoPage />} />
          <Route path="high-school" element={<InfoPage />} />
          <Route path="medical" element={<InfoPage />} />
          <Route path="foreign-life" element={<InfoPage />} />
          <Route path="single-household" element={<InfoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
