document.addEventListener("DOMContentLoaded", () => {
  // Превращаем коллекцию чекбоксов в массив и разворачиваем его
  const checkboxes = Array.from(
    document.querySelectorAll(".row-box"),
  ).reverse();

  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        // Теперь "последующие" элементы в массиве — это элементы левее на экране
        for (let i = index + 1; i < checkboxes.length; i++) {
          checkboxes[i].checked = true;
        }
      }
    });
  });
});
