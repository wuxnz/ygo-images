/**
 * @type {import('node:https')}
 **/
const https = require("node:https");
/**
 * @type {import('node:fs')}
 **/
const fs = require("node:fs");
/**
 * @type {import('node:os')}
 **/
const os = require("node:os");
/**
 * @type {import('node:path')}
 **/
const path = require("node:path");
/**
 * @type {import('node:child_process')}
 **/
const childProcess = require("node:child_process");

const AGGREGATE_ZIP_URL =
  "https://github.com/iconmaster5326/YGOJSON/releases/download/v1/aggregate.zip";

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "ygo-images-ygojson-downloader",
        },
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          downloadFile(new URL(response.headers.location, url).toString(), dest)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error("Response status was " + response.statusCode));
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);

        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      }
    );

    request.on("error", reject);
  });
};

const extractZip = (zipFile, dest) => {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn("tar", ["-xf", zipFile, "-C", dest], {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error("tar exited with status " + code));
    });
  });
};

const main = async () => {
  const directory = process.argv[2] || "data";
  const filename = process.argv[3] || "cards-ygojson.json";
  const destination = path.resolve(directory, filename);
  const tempDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "ygojson-")
  );
  const zipFile = path.join(tempDirectory, "aggregate.zip");

  try {
    await fs.promises.mkdir(directory, { recursive: true });
    await downloadFile(AGGREGATE_ZIP_URL, zipFile);
    await extractZip(zipFile, tempDirectory);

    const cardsFile = path.join(tempDirectory, "cards.json");
    const cards = JSON.parse(await fs.promises.readFile(cardsFile, "utf-8"));

    if (!Array.isArray(cards)) {
      throw new Error("Expected YGOJSON aggregate cards.json to be an array");
    }

    await fs.promises.writeFile(
      destination,
      JSON.stringify({ data: cards }, null, 2)
    );

    console.log("YGOJSON cards data saved in", destination);
    console.log("Card count:", cards.length);
  } finally {
    await fs.promises.rm(tempDirectory, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
