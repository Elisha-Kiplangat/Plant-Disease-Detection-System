import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

// Test connection
pool
  .connect()
  .then((client) => {
    console.log("PostgreSQL connected");
    client.release();
  })
  .catch((err) => console.error("DB connection error:", err));

export interface Prediction {
  imageName: string;
  plant_name: string;
  disease: string;
  confidence: number;
  health_score: number;
}

// Save prediction
export async function savePrediction(
  prediction: Prediction
) {
  const query = `
    INSERT INTO predictions
    (
      image_name,
      plant_name,
      disease,
      confidence,
      health_score
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING *;
  `;

  const values = [
    prediction.imageName,
    prediction.plant_name,
    prediction.disease,
    prediction.confidence,
    prediction.health_score,
  ];

  try {
    const result = await pool.query(query, values);

    console.log("Prediction saved");

    return result.rows[0];
  } catch (error) {
    console.error("Error saving prediction:", error);
    throw error;
  }
}

// Get all predictions
export async function getPredictions() {
  const result = await pool.query(`
    SELECT *
    FROM predictions
    ORDER BY created_at DESC;
  `);

  return result.rows;
}

// Get prediction statistics
export async function getPredictionStats() {
  const total = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM predictions;
  `);

  const diseases = await pool.query(`
    SELECT
      disease,
      COUNT(*)::int AS total
    FROM predictions
    GROUP BY disease
    ORDER BY total DESC;
  `);

  return {
    totalPredictions: total.rows[0].total,
    diseases: diseases.rows,
  };
}