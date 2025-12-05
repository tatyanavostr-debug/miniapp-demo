export default async function handler(req, res) {
  try {
    // Cчитываем JSON в serverless-режиме
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    const { name, date } = JSON.parse(body || "{}");

    if (!name || !date) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing name or date" }));
      return;
    }

    const openAIKey = process.env.OPENAI_API_KEY;

    if (!openAIKey) {
      console.error("Нет переменной OPENAI_API_KEY!");
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "No API key on server" }));
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Ты даёшь мягкие, короткие и доброжелательные персональные трактовки по дате рождения без эзотерики и мистики. Формат 4–6 предложений, спокойный аналитичный тон."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}. Дай персональную характеристику.`
          }
        ]
      })
    });

    const data = await response.json();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result: data.choices?.[0]?.message?.content || "Модель не дала ответа" }));

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error" }));
  }
}
