(() => {
  const quotes = [
    { text: "Знание — сила.", author: "Фрэнсис Бэкон" },
    { text: "Я мыслю, следовательно, существую.", author: "Рене Декарт" },
    { text: "Пока мы откладываем жизнь, она проходит.", author: "Сенека" },
    { text: "Путь в тысячу ли начинается с одного шага.", author: "Лао-цзы" },
    { text: "Терпение — ключ к облегчению.", author: "Арабская пословица" },
    { text: "Кто не задаёт вопросов, тот не узнает нового.", author: "Восточная пословица" },
    { text: "Учиться никогда не поздно.", author: "Европейская пословица" }
  ];

  const quote = document.getElementById("daily-quote");
  const author = document.getElementById("quote-author");
  if (!quote || !author) return;

  let current = 0;
  window.setInterval(() => {
    const card = document.querySelector(".quote-card");
    card.classList.add("is-changing");
    window.setTimeout(() => {
      current = (current + 1) % quotes.length;
      quote.textContent = quotes[current].text;
      author.textContent = quotes[current].author;
      card.classList.remove("is-changing");
    }, 450);
  }, 12000);
})();
