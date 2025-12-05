export default async function handler(req, res) {
  try {
    // собираем имя и дату
    const url = new URL(req.url, `https://${req.headers.host}`);
    let name = url.searchParams.get("name");
    let date = url.searchParams.get("date");

    if (!name || !date) {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      try {
        const parsed = JSON.parse(body || "{}");
        name = parsed.name;
        date = parsed.date;
      } catch (e) {}
    }

    if (!name || !date) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing name or date" }));
      return;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "No API key on server" }));
      return;
    }

    // отправляем запрос как есть
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-5.1-mini",
        input: [
          {
            role: "system",
            content: "Дай мягкое, короткое описание по дате рождения."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}.`
          }
        ]
      })
    });

    const data = await response.json();

    // !!! возвращаем сырой ответ целиком
    res.statusCode = response.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data, null, 2));

  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SERVER CRASH", details: String(err) }));
  }
}
