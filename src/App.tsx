import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from "@/pages/UploadPage";
import MeetingMinutesPage from "@/pages/MeetingMinutesPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/result" element={<MeetingMinutesPage />} />
        <Route path="/result/:taskId" element={<MeetingMinutesPage />} />
      </Routes>
    </Router>
  );
}
