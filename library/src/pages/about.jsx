import "./about.css";

function About() {
  return (
    <div className="about-page">

      {/* HERO */}
      <section className="hero-section">
        <div className="overlay">
          <div className="hero">
            <h1>About Library Search.</h1>
            <p>Discover, explore and manage your reading journey.</p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="about-content">

        <div className="about-card">
          <h2>What Does This Application Do?</h2>
          <p>
            Library Search allows users to search books,
            explore featured collections, and manage their
            favorite reading list in a modern interface.
          </p>
        </div>

        <div className="about-card">
          <h2>Main Features</h2>
          <ul>
            <li>🔍 Instant book search</li>
            <li>📚 Explore collections</li>
            <li>❤️ Save favorites</li>
            <li>👨‍💼 Admin management</li>
          </ul>
        </div>

      </section>

    </div>
  );
}

export default About;