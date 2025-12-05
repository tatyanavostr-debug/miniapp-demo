export default async function handler(req, res) {
  try {
    let name = "", date = "";

    // GET parameters
    const url = new URL(req.url, `https://${req.headers.host}`);
    const qName = url.searchParams.get("name");
    const qDate = url.searchParams.get("date");

    if (qName && qDate) {
      name = qName;
      date = qDate;
    } else {
      // POST body
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });

      if (body) {
        const parsed = JSON.parse(body);
        name = parsed.name;
        date = parsed.date;
      }
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
      res.end(JSON.stringify({ error: "No API key found on server" }));
      return;
    }

    // ******* ВАЖНЫЙ МОМЕНТ *******
    // GPT-5.1 вызывается через /v1/responses
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
            content: "Ты даёшь мягкий, короткий, доброжелательный персональный анализ по дате рождения. 4–6 предложений. Без мистики."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}. Дай характеристику.`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("RAW MODEL RESPONSE:", data);

    const text =
      data.output_text ||
      data.output || 
      data.choices?.[0]?.message?.content;

    if (!text) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Empty response", raw: data }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result: text }));

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error" }));
  }
}
