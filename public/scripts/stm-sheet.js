document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".row-box");

  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", function () {
      // Кликнули на ЧЕКНУТЫЙ бокс -> заполняем всё СЛЕВА, сбрасываем всё СПРАВА
      if (this.checked) {
        checkboxes.forEach((box, i) => {
          box.checked = i <= index;
        });
      }
      // Кликнули на УЖЕ ОТМЕЧЕННЫЙ бокс (чтобы снять галочку) ->
      // сбрасываем его и ВСЕ элементы СПРАВА от него
      else {
        checkboxes.forEach((box, i) => {
          if (i >= index) {
            box.checked = false;
          }
        });
      }
    });
  });
});
