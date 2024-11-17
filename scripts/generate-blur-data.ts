#!/usr/bin/env bun
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const smugsDirectory = path.join(process.cwd(), "public", "smugs");

const smugs = await fs.readdir(smugsDirectory);

const blurData: Record<string, string> = {};

for (const smug of smugs) {
  const smugPath = path.join(smugsDirectory, smug);
  const imageBuffer = await sharp(smugPath).resize(10).toBuffer();

  blurData[smug] = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
}

await fs.writeFile(
  path.join(process.cwd(), "app", "lib", "blur-data.json"),
  JSON.stringify(blurData, null, 2),
);

console.log("Blur data generated!");
