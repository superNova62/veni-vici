
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_KEY = "live_wjUrg6g6FSsOdZms80Yh3hJw8DsNSQ4999kvFhNSTaEnOMwpvLRDjf65c5m9xqEw";
const API_URL = "https://api.thedogapi.com/v1";

function App() {
  const [breeds, setBreeds] = useState([]);
  const [dog, setDog] = useState(null);
  const [dogImage, setDogImage] = useState("");
  const [banned, setBanned] = useState([]);
  const [seen, setSeen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBreeds() {
      try {
        const response = await fetch(`${API_URL}/breeds?limit=1000`, {
          headers: { "x-api-key": API_KEY },
        });

        if (!response.ok) throw new Error("Could not load dog breeds.");

        const data = await response.json();
        setBreeds(data);
      } catch {
        setError("We couldn't load the dogs. Check your API key and try again.");
      }
    }

    loadBreeds();
  }, []);

  const discoverDog = useCallback(async () => {
    if (!breeds.length || loading) return;

    setLoading(true);
    setError("");

    try {
      const availableBreeds = breeds.filter((breed) => {
        const values = [
          breed.name,
          breed.temperament,
          breed.life_span,
          breed.origin,
        ].filter(Boolean);

        return !values.some((value) =>
          banned.some(
            (item) => item.value.toLowerCase() === value.toLowerCase()
          )
        );
      });

      if (!availableBreeds.length) {
        setLoading(false);
        return;
      }

      const shuffled = [...availableBreeds].sort(() => Math.random() - 0.5);
      let foundDog = null;
      let foundImage = "";

      for (const breed of shuffled.slice(0, 12)) {
        const response = await fetch(
          `${API_URL}/images/search?breed_ids=${breed.id}&limit=1`,
          { headers: { "x-api-key": API_KEY } }
        );

        if (!response.ok) continue;

        const images = await response.json();

        if (images.length && images[0].url) {
          foundDog = breed;
          foundImage = images[0].url;
          break;
        }
      }

      if (!foundDog) {
        throw new Error("No dog photos were found. Please try again.");
      }

      setDog(foundDog);
      setDogImage(foundImage);
      setSeen((previous) => {
        if (previous.some((item) => item.id === foundDog.id)) {
          return previous;
        }

        return [
          { id: foundDog.id, name: foundDog.name, image: foundImage },
          ...previous,
        ].slice(0, 12);
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [breeds, banned, loading]);

  useEffect(() => {
    if (breeds.length && !dog && !loading && !error) {
      discoverDog();
    }
  }, [breeds, dog, loading, error, discoverDog]);

  function toggleBan(value, type) {
    if (!value) return;

    setBanned((previous) => {
      const exists = previous.some(
        (item) => item.value === value && item.type === type
      );

      if (exists) {
        return previous.filter(
          (item) => !(item.value === value && item.type === type)
        );
      }

      return [...previous, { value, type }];
    });
  }

  function Attribute({ label, value, type }) {
    if (!value) return null;

    const isBanned = banned.some(
      (item) => item.value === value && item.type === type
    );

    return (
      <button
        className={`attribute ${isBanned ? "attribute-banned" : ""}`}
        onClick={() => toggleBan(value, type)}
        title={`Click to ${isBanned ? "remove" : "ban"} ${value}`}
      >
        <span className="attribute-label">{label}</span>
        <span className="attribute-value">{value}</span>
        <span className="attribute-icon">{isBanned ? "×" : "+"}</span>
      </button>
    );
  }

  return (
    <div className="app-shell">
      <div
        className="background-collage"
        style={
          dogImage
            ? { backgroundImage: `url("${dogImage}")` }
            : undefined
        }
      />
      <div className="background-overlay" />

      <main className="discovery-panel">
        <header className="brand-header">
          <span className="brand-icon">🐾</span>
          <span>Today's Dog</span>
        </header>

        <div className="hero-copy">
          <h1>Today's Dog</h1>
        </div>

        {error && <p className="error-message">{error}</p>}

        {dog && (
          <section className="dog-card">
            <div className="dog-image-wrap">
              <img className="dog-image" src={dogImage} alt={dog.name} />
            </div>

            <div className="dog-information">
              <p className="dog-category">Breeds</p>
              <h2>{dog.name}</h2>
              <p className="dog-subtitle">
                {dog.bred_for || "A one-of-a-kind companion"}
              </p>

              <div className="attributes">
                <Attribute
                  label="LIFE SPAN"
                  value={dog.life_span}
                  type="life_span"
                />
                <Attribute
                  label="TEMPERAMENT"
                  value={dog.temperament?.split(",")[0]?.trim()}
                  type="temperament"
                />
                <Attribute
                  label="ORIGIN"
                  value={dog.origin || "Unknown"}
                  type="origin"
                />
              </div>

            </div>
          </section>
        )}

        <button onClick={discoverDog}>
          Discover!
        </button>

      </main>

      <div className="ban-panel">
        <div className="ban-heading">
          <h2>Ban List</h2>
        </div>

        <div className="ban-list">
          {banned.length === 0 ? (
            <div className="ban-empty">
            </div>
          ) : (
            banned.map((item) => (
              <button
                className="ban-chip"
                key={`${item.type}-${item.value}`}
                onClick={() => toggleBan(item.value, item.type)}
                title="Click to remove from ban list"
              >
                <span className="ban-chip-type">{item.type.replace("_", " ")}</span>
                <span>{item.value}</span>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default App;

