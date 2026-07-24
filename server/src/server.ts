import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";

import { predictPlantDisease } from "./inference";
import {
  savePrediction,
  getPredictions,
  getPredictionStats,
} from "./db";

const app = express();

const PORT = 3000;

app.use(cors())

app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({

  destination(req,file,cb){

    cb(null,"uploads");

  },

  filename(req,file,cb){

    const ext = path.extname(file.originalname);

    cb(
      null,
      `${Date.now()}${ext}`
    );

  }

});

const upload = multer({storage});

app.post(
  "/api/upload",
  upload.single("image"),
  async(req,res)=>{

    if(!req.file){

      return res.status(400).json({
        error:"No image uploaded"
      });

    }
    console.log(req.file.path);

    try{

      const prediction =
      await predictPlantDisease(
        req.file.path
      );

      await savePrediction({
        imageName: req.file.filename,
        plant_name: prediction.plant_name,
        disease: prediction.disease,
        confidence: prediction.confidence,
        health_score: prediction.health_score,
      });

      res.json({
        image:req.file.filename,
        ...prediction
      });

      console.log(prediction);

    }

    catch (err: any) {
  console.error(err);

  res.status(500).json({
    error: err.message
  });
}

app.get("/api/predictions", async (_, res) => {
  try {
    const predictions = await getPredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch predictions",
    });
  }
});

app.get("/api/stats", async (_, res) => {
  try {
    const stats = await getPredictionStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch statistics",
    });
  }
});

});

app.listen(PORT,()=>{

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});