export default async function handler(req, res) {
  try {
    let name = "", date = "";

    const url = new URL(req.url, `https://${req.headers.host}`);
    const qName = url.searchParams.get("name");
    const qDate = url.searchParams.get("date");

    if (qName && qDate) {
      name = qName;
      date = qDate;
    } else {
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

    if (!name || !date) {
      return new Response(JSON.stringify({ error: "Missing name or date" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return new Response(JSON.stringify({ error: "No API key on server" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Дай короткий, дружелюбный, позитивный комментарий по дате рождения." },
          { role: "user", content: `Имя: ${name}. Дата рождения: ${date}.` }
        ],
        max_tokens: 150
      })
    });

    const data = await apiRes.json();
    console.log("API response:", data);

    const result = data.choices?.[0]?.message?.content;
    if (!result) {
      return new Response(JSON.stringify({ error: "Empty response from model", raw: data }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ result }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
