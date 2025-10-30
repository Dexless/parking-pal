export default function Menu() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
      padding: "0.2rem",
      position: "flex",
      top: 0,
      width: "100%",
      boxShadow: "0 2px 2px rgba(0,0,0,0.1)"
    }}>
      <a href="#">P1 & 2</a>
      <a href="#">P5 & 6</a>
      <a href="#">P15</a>
      <a href="#">P20</a>
      <a href="#">P27</a>
      <a href="#">P11</a>
      <a href="#">P13</a>
    </nav>
  );
}
