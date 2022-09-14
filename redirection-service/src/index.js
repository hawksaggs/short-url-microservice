require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { consumeQueue } = require("./services/MQService");
const { createClient } = require("redis");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const APP_URL = process.env.APP_URL;
const PORT = process.env.APP_PORT || 3000;
const HOST = "0.0.0.0";

const client = createClient({
  socket: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  },
});
client.on("error", (err) => console.log("Redis Client Error: ", err));
client.on("ready", (err) => console.log("Redis connected"));
client.connect();

async function manageMessage(msg) {
  // console.log("manageMessage: ", msg);
  const type = msg.properties.type;
  const parsedMessage = JSON.parse(msg.content);
  // console.log("parsedMessage: ", parsedMessage);

  if (type === "urls.create") {
    await client.hSet(parsedMessage.shortUrlHash, {
      id: parsedMessage.id,
      realUrl: parsedMessage.realUrl,
    });
  }

  if (type === "urls.delete") {
    await client.del(parsedMessage.shortUrlHash);
  }
}

consumeQueue(manageMessage);

app.get("/", (req, res) => {
  return res.json("Hello World!!");
});

app.get("/:hash", async (req, res) => {
  const hash = req.params.hash;
  const keyHash = await client.hGetAll(hash);
  const data = JSON.parse(JSON.stringify(keyHash, null, 2));
  if (Object.keys(data).length === 0) {
    return res.status(404).json(`URL does not exist: ${APP_URL}${hash}`);
  }

  const counterKey = `counter:${hash}`;
  const counter = await client.get(counterKey);
  if (!counter) {
    await client.set(counterKey, 1, {
      EX: 120,
    });
    return res.redirect("http://" + data.realUrl);
  }

  const newCounterValue = await client.incrBy(counterKey, 1);
  if (newCounterValue > 10) return res.status(429).json("Too many redirects");

  return res.redirect("http://" + data.realUrl);
});

app.listen(PORT, HOST);
