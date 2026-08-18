import { useEffect, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface Prediction {
  id?: number;
  plant_name: string;
  disease: string;
  confidence: number;
  health_score: number;
  image?: string;
  created_at?: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch(`${import.meta.env.BACKEND_URL}predictions`);
      const data = await res.json();
      setHistory(data);
    } catch {}
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const img = e.target.files?.[0];
    if (!img) return;

    setFile(img);
    setPrediction(null);
    setError("");

    const reader = new FileReader();

    reader.onload = () => setPreview(reader.result as string);

    reader.readAsDataURL(img);
  }

  async function analyze() {
    if (!file) return;

    setLoading(true);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch(`${import.meta.env.BACKEND_URL}upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setPrediction(data);

      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="container">

      <header className="header">

        <div>

          <h1>Tomato Disease Detection</h1>

          <p className="subtitle">
            AI powered tomato leaf analysis
          </p>

        </div>

        <div className="status">

          <span className="dot"></span>

          {/* Online */}

        </div>

      </header>

      <div className="main">

        {/* Upload */}

        <section className="card">

          <div className="upload-section">

  <div className="section-header">
    <h2>Upload Image</h2>
    <p>Select a tomato leaf image for analysis</p>
  </div>

  <div className="image-preview">

    {preview ? (
      <img
        src={preview}
        alt="Preview"
        className="preview"
      />
    ) : (
      <div className="placeholder">

        <Upload size={42} />

        <h3>No image selected</h3>

        <p>PNG, JPG or JPEG</p>

      </div>
    )}

  </div>

  <label className="upload-box">

    <Upload size={18} />

    <div>
      <strong>Choose Image</strong>
      <span>Click to browse your files</span>
    </div>

    <input
      hidden
      type="file"
      accept="image/*"
      onChange={handleImage}
    />

  </label>

</div>

          <button
            disabled={!file || loading}
            onClick={analyze}
          >

            {loading ? (
              <span className="loading-content">
  <Loader2
    size={18}
    className="animate-spin"
  />
  <span>Analyzing...</span>
</span>
            ) : (
              "Analyze Image"
            )}

          </button>

        </section>

        {/* Prediction */}

        <section className="card prediction-card">

  <div className="section-header">
    <h2>Prediction Result</h2>
    <p>AI analysis of the uploaded tomato leaf</p>
  </div>

  {!prediction ? (
    <div className="prediction-placeholder">

      <h3>No Prediction Yet</h3>

      <p>
        Upload a tomato leaf image and click
        <strong> Analyze Image</strong> to get results.
      </p>

    </div>
  ) : (
    <>

      <div className="prediction-summary">

        <h3>{prediction.disease}</h3>

        <span className="confidence-badge">
          {prediction.confidence}% Confidence
        </span>

      </div>

      <div className="metrics">

        <div className="metric-card">

          <span>Plant</span>

          <strong>{prediction.plant_name}</strong>

        </div>

        <div className="metric-card">

          <span>Disease</span>

          <strong>{prediction.disease}</strong>

        </div>

        <div className="metric-card">

          <span>Confidence</span>

          <strong>{prediction.confidence}%</strong>

        </div>

        <div className="metric-card">

          <span>Health Score</span>

          <strong>{prediction.health_score}%</strong>

        </div>

      </div>

      <div className="health-section">

        <div className="health-header">

          <span>Plant Health</span>

          <strong>{prediction.health_score}%</strong>

        </div>

        <div className="progress">

          <div
            style={{
              width: `${prediction.health_score}%`,
            }}
          />

        </div>

      </div>

    </>
  )}

  {error && (
    <div className="error">
      {error}
    </div>
  )}

</section>

      </div>

      {/* History */}

      <section className="card history">

        <h2>Recent Predictions</h2>

        <table>

          <thead>

            <tr>
              <th>Date</th>
              <th>Plant</th>

              <th>Disease</th>

              <th>Confidence</th>

              <th>Health</th>

            </tr>

          </thead>

          <tbody>

            {history.length === 0 && (
              <tr>
                <td colSpan={4}>
                  No predictions yet.
                </td>
              </tr>
            )}

            {history.map((item) => (
              <tr key={item.id}>
                <td>
                  {new Date(
                    item.created_at || ""
                  ).toLocaleString()}
                </td>
                <td>{item.plant_name}</td>
                <td>{item.disease}</td>
                <td>{item.confidence}%</td>
                <td>{item.health_score}%</td>
              </tr>
            ))}

          </tbody>

        </table>

      </section>

    </div>
  );
}