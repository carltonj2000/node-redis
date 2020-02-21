const express = require("express");
const redis = require("redis");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const setResponse = (username, repos) => {
  return `<h2>${username} has ${repos} github repos`;
};

const getRepos = async (req, res, next) => {
  try {
    console.log("Fetching Data ...");
    const { username } = req.params;
    const response = await fetch(`http://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const cacheMiddleware = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data == null) return next();
    res.send(setResponse(username, data));
  });
};
app.get("/repos/:username", cacheMiddleware, getRepos);
//app.get("/repos/:username", getRepos);

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
