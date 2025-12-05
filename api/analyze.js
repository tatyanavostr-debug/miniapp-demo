import crypto from "crypto";

export default async function handler(req, res) {
  try {
    let name = "", date = "";

    // GET
    const url = new URL(req.url, `https://${req.headers.host}`);
    name = url.searchParams.get("name");
    date = url.searchParams.get("date");

    // POST fallback
    if (!name || !date) {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });

      if (body) {
        const parsed = JSON.parse(body || "{}");
        name = parsed.name;
        date = parsed.date;
      }
    }

    if (!name || !date) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing name or date" }));
      return;
    }

    // GigaChat keys
    const apiId = process.env.GIGACHAT_API_ID;
    const apiSecret = process.env.GIGACHAT_API_SECRET;

    if (!apiId || !apiSecret) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Missing GigaChat credentials" }));
      return;
    }

    // === 1) Получаем access_token ===
    const tokenResp = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${apiId}:${apiSecret}`).toString("base64"),
        "RqUID": crypto.randomUUID()
      },
      body: "scope=GIGACHAT_API_PERS"
    });

    const tokenJSON = await tokenResp.json();
    const token = tokenJSON.access_token;

    if (!token) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Failed to get access_token", raw: tokenJSON }));
      return;
    }

    // === 2) Запрос к модели ===
    const modelResp = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "GigaChat",
        messages: [
          {
            role: "system",
            content: "Ты пишешь персональный премиальный анализ по дате рождения. Стиль мягкий, аккуратный, уважающий. Без мистики, эзотерики, гороскопов и предсказаний. 4–6 предложений."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}. Дай характеристику.`
          }
        ],
        max_tokens: 250,
        temperature: 0.8
      })
    });

    const modelJSON = await modelResp.json();

    const text =
      modelJSON?.choices?.[0]?.message?.content ||
      null;

    if (!text) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "GigaChat returned no text", raw: modelJSON }));
      return;
    }

    // SUCCESS
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ result: text }));

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server error" }));
  }
}
