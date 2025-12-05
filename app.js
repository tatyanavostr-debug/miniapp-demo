document.getElementById("sendData").addEventListener("click", async function () {
  const name = document.getElementById("userName").value;
  const date = document.getElementById("userDate").value;

  if (!name || !date) {
    document.getElementById("result").innerText = "Введите имя и дату рождения.";
    return;
  }

  document.getElementById("result").innerHTML = "Создаю персональный анализ...";

  try {
    const response = await fetch("https://miniapp-demo-pi.vercel.app/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date })
    });

    const data = await response.json();

    if (data.result) {
      document.getElementById("result").innerHTML =
        `<strong>${name}</strong>, вот ваш персональный анализ:<br><br>${data.result}`;
    } else {
      document.getElementById("result").innerText = "Ошибка при получении ответа от сервера.";
    }

  } catch (error) {
    console.error(error);
    document.getElementById("result").innerText = "Ошибка запроса.";
  }
});
