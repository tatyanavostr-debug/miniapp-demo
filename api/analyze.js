export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { name, date } = await req.json();

    if (!name || !date) {
      return new Response(
        JSON.stringify({ error: "Missing name or date" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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
              "Ты даёшь мягкие, короткие и доброжелательные персональные трактовки по дате рождения без эзотерики и мистики. 4–6 предложений, мягкий аналитичный тон."
          },
          {
            role: "user",
            content: `Имя: ${name}. Дата рождения: ${date}. Дай персональную характеристику.`
          }
        ]
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({ result: data.choices?.[0]?.message?.content || "Нет ответа от модели" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
