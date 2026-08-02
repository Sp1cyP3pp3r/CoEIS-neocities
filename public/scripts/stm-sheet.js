$(function () {
  // 1. Делегирование событий на любой .point-checkbox внутри .point-container
  $(document).on("change", ".point-container .point-checkbox", function () {
    // 2. Изолируем контекст строго в пределах родительского .point-container
    // Это надежнее, чем closest("li"), так как работает независимо от наличия тегов <li>
    const $container = $(this).closest(".point-container");
    const $checkboxes = $container.find(".point-checkbox");
    const index = $checkboxes.index(this);

    if (this.checked) {
      // Пользователь отметил чекбокс:
      // Отмечаем текущий и все СЛЕВА от него
      $checkboxes.slice(0, index + 1).prop("checked", true);
      // Снимаем отметку со всех СПРАВА от него (чтобы трек оставался сплошным)
      $checkboxes.slice(index + 1).prop("checked", false);
    } else {
      // Пользователь снял отметку с уже отмеченного чекбокса:
      // Снимаем отметку с текущего и всех СПРАВА от него.
      // (Если справа нет отмеченных, это просто снимет отметку с текущего, как вы и описали)
      $checkboxes.slice(index).prop("checked", false);
    }

    // 3. Обновляем .point-total
    const totalCount = $container.find(".point-checkbox:checked").length;

    // Гибкий поиск .point-total: сначала внутри контейнера, если нет — среди его соседей
    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");

    $total.text(totalCount);
  });
});
