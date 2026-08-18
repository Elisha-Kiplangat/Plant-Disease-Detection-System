import { spawn } from "child_process";
import path from "path";

export interface Prediction {
  plant_name: string;
  disease: string;
  confidence: number;
  health_score: number;
}

export function predictPlantDisease(
  imagePath: string
): Promise<Prediction> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(
      process.cwd(),
      "src",
      "predict.py"
    );

    const python = spawn("python", [
      pythonScript,
      imagePath,
    ]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
    console.error(data.toString());
    stderr += data.toString();
});

    python.on("error", reject);

    python.on("close", (code) => {
      console.log("STDOUT:");
    console.log(stdout);

    console.log("STDERR:");
    console.log(stderr);
      if (code !== 0) {
        return reject(
          new Error(stderr || `Python exited with code ${code}`)
        );
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(err);
      }
    });
  });
}