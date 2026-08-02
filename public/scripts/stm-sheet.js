document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".approaches-container");
  if (!container) return;

  // 1. Event Delegation: Вешаем ОДИН слушатель на весь контейнер вместо каждого чекбокса
  container.addEventListener("change", (event) => {
    const target = event.target;

    // 2. Проверяем, что клик был именно по нужному чекбоксу
    if (!target.classList.contains("approach-checkbox")) return;

    // 3. Изолируем контекст: берем чекбоксы только внутри текущего <li>
    const checkboxes = Array.from(
      target.closest("li").querySelectorAll(".approach-checkbox"),
    );
    const index = checkboxes.indexOf(target);

    // 4. Оптимизированные циклы: меняем состояние только у тех элементов, которым это нужно
    if (target.checked) {
      // Заполняем всё СЛЕВА (включая текущий)
      for (let i = 0; i <= index; i++) {
        checkboxes[i].checked = true;
      }
    } else {
      // Сбрасываем текущий и ВСЕ элементы СПРАВА
      for (let i = index; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
      }
    }
  });
});
