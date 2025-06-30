import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage.tsx";
import StravaRedirect from "./pages/StravaRedirect.tsx";
import PrivateRoute from "./components/PrivateRoute";
import TeamsPage from "./pages/TeamsPage.tsx";
import CreateTeamPage from "./pages/CreateTeamPage.tsx";
import TeamSelected from "./pages/TeamSelected.tsx";
import InvitesPage from "./pages/InvitesPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/strava-redirect" element={<StravaRedirect />} />
        <Route path="/home" element={ <PrivateRoute> 
            <HomePage /> 
          </PrivateRoute> }
        />
        <Route path="/activities" element={ <PrivateRoute> 
            <ActivitiesPage /> 
          </PrivateRoute> }
        />
        <Route path="/teams" element={ <PrivateRoute> 
            <TeamsPage /> 
          </PrivateRoute> }
        />
        <Route path="/createTeam" element={ <PrivateRoute> 
            <CreateTeamPage /> 
          </PrivateRoute> }
        />
        <Route path="/invites" element={ <PrivateRoute> 
            <InvitesPage /> 
          </PrivateRoute> }
        />
        <Route path="/profile" element={ <PrivateRoute> 
            <ProfilePage /> 
          </PrivateRoute> }
        />
        <Route path="/teams/:id" element={<TeamSelected />} />
      </Routes>
    </Router>
  );
}

export default App;
