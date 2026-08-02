$(function () {
  // 1. Event Delegation: ОДИН слушатель на любой .point-container (работает и для динамически добавленных элементов)
  $(document).on("change", ".point-container .point-checkbox", function () {
    // 2. Изолируем контекст: находим родительский .point-container и текущий <li>
    const $container = $(this).closest(".point-container");
    const $li = $(this).closest("li");
    const $checkboxes = $li.find(".point-checkbox");

    // 3. Получаем индекс текущего чекбокса относительно группы
    const index = $checkboxes.index(this);

    // 4. Используем .slice() для точечного изменения свойств только нужных элементов
    if (this.checked) {
      // Заполняем всё СЛЕВА (включая текущий): от 0 до index + 1
      $checkboxes.slice(0, index + 2).prop("checked", true);
    } else {
      // Сбрасываем текущий и ВСЕ элементы СПРАВА: от index до конца
      $checkboxes.slice(index).prop("checked", false);
    }

    // 5. Обновляем sibling .point-total
    // Считаем все отмеченные чекбоксы внутри этого .point-container
    const totalCount = $container.find(".point-checkbox:checked").length;

    // Находим соседний элемент .point-total и обновляем его текст
    $container.siblings(".point-total").text(totalCount);
  });
});
