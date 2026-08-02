$(function () {
  // 1. Event Delegation: ОДИН слушатель на весь контейнер
  $(".approaches-container").on("change", ".approach-checkbox", function () {
    // 2. Изолируем контекст: находим родительский <li> и чекбоксы внутри него
    const $li = $(this).closest("li");
    const $checkboxes = $li.find(".approach-checkbox");

    // 3. Получаем индекс текущего чекбокса относительно группы
    const index = $checkboxes.index(this);

    // 4. Используем .slice() для точечного изменения свойств только нужных элементов
    if (this.checked) {
      // Заполняем всё СЛЕВА (включая текущий): от 0 до index + 1
      $checkboxes.slice(0, index + 1).prop("checked", true);
    } else {
      // Сбрасываем текущий и ВСЕ элементы СПРАВА: от index до конца
      $checkboxes.slice(index).prop("checked", false);
    }
  });
});
