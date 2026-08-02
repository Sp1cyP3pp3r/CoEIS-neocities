document.addEventListener("DOMContentLoaded", () => {
  // Находим все чекбоксы на странице
  const checkboxes = document.querySelectorAll(".row-box");

  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", function () {
      // Если чекбокс отмечен, отмечаем все последующие
      if (this.checked) {
        for (let i = index + 1; i < checkboxes.length; i++) {
          checkboxes[i].checked = true;
        }
      }
    });
  });
});
