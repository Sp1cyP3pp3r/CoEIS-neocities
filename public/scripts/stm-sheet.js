document.addEventListener("DOMContentLoaded", () => {
  // 1. Находим все контейнеры-группы (в вашем случае это <li>)
  const containers = document.querySelectorAll(".approaches-container li");

  containers.forEach((container) => {
    // 2. Находим чекбоксы ТОЛЬКО внутри текущего контейнера
    const checkboxes = container.querySelectorAll(".approach-checkbox");

    checkboxes.forEach((checkbox, index) => {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          // Кликнули на чекбокс -> заполняем всё СЛЕВА (включая текущий)
          checkboxes.forEach((box, i) => {
            box.checked = i <= index;
          });
        } else {
          // Сняли галочку -> сбрасываем текущий и ВСЕ элементы СПРАВА
          checkboxes.forEach((box, i) => {
            if (i >= index) {
              box.checked = false;
            }
          });
        }
      });
    });
  });
});
