export default async function handler(req, res) {
  try {
    let name = "";
    let date = "";

    // 1) Читаем GET параметры
    const url = new URL(req.url, `https://${req.headers.host}`);
    const qName = url.searchParams.get("name");
    const qDate = url.searchParams.get("date");

    if (qName && qDate) {
      name = qName;
      date = qDate;
    } else {
      // 2) Читаем тело POST
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });

      if (body) {
        const parsed = JSON.parse(body);
        name = parsed.name;
        date = parsed.date;
      }
    }

    // Если данных всё ещё нет
    if (!name || !date) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing name or date" }));
      return;
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "No API key on server" }));
      return;
    }

    // Запрос к OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.1-mini",
        messages: [
          {
            role: "system",
            content: "Ты даёшь мягкие, короткие, доброжелательные персональные трактовки по дате рождения. 4–6 предложений. Спокойный аналитичный тон. Без эзотерики."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}. Дай персональную характеристику.`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("OpenAI API Raw:", data);

    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Empty response from model" }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result }));

  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error" }));
  }
}
