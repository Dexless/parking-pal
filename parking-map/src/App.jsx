import './App.css' 
import Menu from "./menu.jsx";

// import image taken from school website 
import mapImage from "./assets/campus-map.png"; 

function App() { 
    return ( 
   <div>
      {/* menu from menu.jsx */}
      <Menu />

      { /* adds parking map image */}
      <img
        src={mapImage}
        alt="Parking Map"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
    ); 
} export default App
