document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".row-box");

  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", function () {
      // Запускаем цикл по всем последующим чекбоксам
      for (let i = index + 1; i < checkboxes.length; i++) {
        // Если текущий чекбокс отметили — отмечаем последующие.
        // Если сняли отметку — снимаем и с последующих.
        checkboxes[i].checked = this.checked;
      }
    });
  });
});
