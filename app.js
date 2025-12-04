document.getElementById("sendData").addEventListener("click", function () {
  const name = document.getElementById("userName").value;
  const date = document.getElementById("userDate").value;

  if (!name || !date) {
    document.getElementById("result").innerText = "Введите имя и дату рождения.";
    return;
  }

  document.getElementById("result").innerHTML = `
    <strong>${name}</strong>, ваш день рождения — <strong>${date}</strong>.<br/><br/>
    Это пример результата. Следующий шаг — подключение AI, чтобы сформировать персональную интерпретацию на основе ваших данных.
  `;
});
