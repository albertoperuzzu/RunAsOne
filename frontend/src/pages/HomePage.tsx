import Button from "../components/Button";
import Navbar from "../components/Navbar";

function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <img
          src="/runasone.png"
          alt="RunAsOne logo"
          className="w-40 h-40 mb-8"
        />
        <Button
          variant="strava"
          onClick={() => {
            console.log("http://localhost:8000/strava_login");
            window.location.href = "http://localhost:8000/strava_login";
          }}
        >
          Importa da Strava
        </Button>
      </div>
    </div>
  );
}

export default HomePage;