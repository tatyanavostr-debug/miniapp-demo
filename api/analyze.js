export default async function handler(req, res) {
  try {
    // Читаем тело запроса (JSON)
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const { name, date } = JSON.parse(body || "{}");

    if (!name || !date) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing name or date" }));
      return;
    }

    const openAIKey = process.env.OPENAI_API_KEY;

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
              "Ты даёшь мягкие, короткие и доброжелательные персональные трактовки по дате рождения без эзотерики и предсказаний. Отвечай спокойно, 4–6 предложений, без лишней мистики."
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
    res.end(JSON.stringify({ result: data.choices?.[0]?.message?.content || "Нет ответа от AI" }));

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error" }));
  }
}
